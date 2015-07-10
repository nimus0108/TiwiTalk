
package tiwitalk.pigeon

import akka.actor.{ Actor, ActorRef, ActorSystem }
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{ HttpRequest, StatusCodes }
import akka.http.scaladsl.model.HttpMethods._
import akka.http.scaladsl.unmarshalling.Unmarshal
import akka.stream._
import java.net.URLEncoder.{ encode => urlEncode }
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import upickle.default.read

class Sentiment(implicit mat: ActorMaterializer, system: ActorSystem) {

  val apiKey = "1ec5f5442d50d58b77a70e91932bc49f6f37f99d"
  val apiUrl = s"http://api.repustate.com/v3/$apiKey/score.json?text="

  def analyze(text: String): Future[Any] = {
    val request = HttpRequest(POST, uri = apiUrl + urlEncode(text, "UTF-8"))
    for {
      response <- Http().singleRequest(request)
      result <- Unmarshal(response).to[String]
    } yield {
      text -> read[Response](result).score
    }
  }

  case class Response(status: String, score: Float)
}
