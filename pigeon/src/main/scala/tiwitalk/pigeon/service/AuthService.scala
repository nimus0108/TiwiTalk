package tiwitalk.pigeon.service

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.headers._
import akka.http.scaladsl.model.{ HttpRequest, StatusCodes }
import akka.http.scaladsl.model.HttpMethods._
import akka.http.scaladsl.unmarshalling.Unmarshal
import akka.http.scaladsl.model.ContentTypes
import akka.stream._
import java.net.URLEncoder.{ encode => urlEncode }
import java.util.UUID
import scala.concurrent.{ ExecutionContext, Future }
import scala.util.{ Failure, Success, Try }
import upickle.default._

/**
 * Service for authenticating users.
 */
class AuthService(apiKey: String, appId: String)(implicit system: ActorSystem,
    mat: ActorMaterializer, ec: ExecutionContext) {

  import AuthService._

  val http = Http()
  val baseUrl = "https://api.parse.com/1"

  /**
   * @return A [[scala.concurrent.Future]] of the session token.
   * @todo Implement username system
   */
  def signup(email: String, password: String, id: UUID): Future[String] = {
    val data = Signup(email, email, password, id.toString)
    val req = 
      HttpRequest(POST, uri = s"$baseUrl/users")
        .withParse(apiKey, appId)
        .withEntity(ContentTypes.`application/json`, write(data))

    val fut = for {
      response <- http.singleRequest(req)
      str <- Unmarshal(response).to[String]
    } yield {
      Try(read[LoginResponse](str).sessionToken)
    }

    fut flatMap {
      case Success(x) => Future.successful(x)
      case Failure(x) => Future.failed(x)
    }
  }

  /**
   * @return A [[scala.concurrent.Future]] of an [[Either]] of the
   * session token (right) or error message (left).
   */
  def login(username: String,
            password: String): Future[Either[String, String]] = {
    val unameEnc = urlEncode(username, "UTF-8")
    val pwEnc = urlEncode(password, "UTF-8")
    val params = s"username=$unameEnc&password=$pwEnc"
    val req = 
      HttpRequest(GET, uri = s"$baseUrl/login?$params")
        .withParse(apiKey, appId)

    for {
      response <- http.singleRequest(req)
      str <- Unmarshal(response).to[String]
    } yield {
      if (response.status == StatusCodes.OK) {
        Right(read[LoginResponse](str).sessionToken)
      } else {
        Left(read[ErrorResponse](str).error)
      }
    }
  }

  /**
   * @param token The session token to verify.
   * @return A [[scala.concurrent.Future]] of the email and id of the token
   * bearer.
   */
  def verify(token: String): Future[(String, UUID)] = {
    val req =
      HttpRequest(GET, uri = s"$baseUrl/users/me")
        .withParse(apiKey, appId)
        .withSession(token)

    for {
      response <- http.singleRequest(req) if response.status == StatusCodes.OK
      str <- Unmarshal(response).to[String]
    } yield {
      val r = read[VerifyResponse](str)
      (r.email, r.pigeonId)
    }
  }
}

object AuthService {
  case class Signup(
      username: String,
      email: String,
      password: String,
      pigeonId: String)
  case class VerifyResponse(username: String, email: String, pigeonId: UUID)
  case class LoginResponse(sessionToken: String)
  case class ErrorResponse(code: Int, error: String)

  implicit class ParseRequest(req: HttpRequest) {
  
    def withParse(apiKey: String, appId: String): HttpRequest = {
      req.withHeaders(
        RawHeader("X-Parse-Application-Id", appId),
        RawHeader("X-Parse-REST-API-Key", apiKey)
      )
    }
  
    def withSession(token: String): HttpRequest = {
      req.addHeader(RawHeader("X-Parse-Session-Token", token))
    }
  }
}
