package controllers

import java.util.{ NoSuchElementException, UUID }
import java.time.Clock
import javax.inject.Inject
import play.api._
import play.api.data.Form
import play.api.data.Forms.{ mapping, nonEmptyText, optional, single, text }
import play.api.i18n.{ I18nSupport, MessagesApi }
import play.api.libs.json._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.mailer._
import play.api.mvc._
import scala.concurrent.Future
import scala.util.Try

import dao._
import models._
import models.Models._

class Application @Inject()(users: UsersDAO, tokens: TokensDAO,
    mailer: MailerClient, val messagesApi: MessagesApi) extends Controller
    with I18nSupport {

  val beginSignupForm = Form(single("email" -> nonEmptyText))

  val verifyForm = Form(
    mapping(
      "token" -> nonEmptyText,
      "name" -> nonEmptyText,
      "referredBy" -> optional(text)
    )(UserRegistration.apply)(UserRegistration.unapply)
  )

  def index = Action {
    Ok(views.html.index())
  }

  def all = Action.async {
    users.all map { all =>
      val reply = Json.obj("status" -> "ok", "users" -> Json.toJson(all))
      Ok(reply)
    }
  }

  def sendVerificationEmail = Action.async { implicit request =>
    beginSignupForm.bindFromRequest.fold(
      error => Future.successful(BadRequest("")),
      email => {
        val token = UUID.randomUUID
        val time = Clock.systemUTC.millis
        val fut = for {
          user <- users.find(email) if !user.isDefined
          _ <- tokens.deleteEmailToken(email)
          _ <- tokens.insert(Token(email, token, time))
        } yield {
          val bodyText = views.html.verificationEmail(email, token.toString).body
          val mailToSend = Email(
            "Complete Your Registration For TiwiTalk!",
            "No-reply <noreply@tiwitalk.com>",
            Seq("<" + email + ">"),
            bodyHtml = Some(bodyText))
          mailer.send(mailToSend)
          Ok(Json.obj())
        }

        fut recover {
          case _: NoSuchElementException => Ok(Json.obj())
        }
      }
    )
  }

  def registerPage = Action.async { implicit request =>
    @inline def invalid = Redirect("/")
    val response = for {
      token <- request.queryString.get("token") flatMap (_.headOption)
      uuid <- Try(UUID.fromString(token)).toOption
    } yield {
      tokens.find(uuid) map {
        case Some(_) => Ok(views.html.register(uuid.toString))
        case None => invalid
      }
    }
    
    response getOrElse Future.successful(invalid)
  }

  def register = Action.async { implicit request =>
    @inline def invalid = Unauthorized(Json.obj("status" -> "rejected"))
    verifyForm.bindFromRequest.fold(
      errors => {
        val reply = Json.obj(
          "status" -> "error",
          "errors" -> errors.errorsAsJson)
        Future.successful(BadRequest(reply))
      },
      ur => {
        Try(UUID.fromString(ur.token)) map { uuid =>
          val fut = for {
            token <- tokens.find(uuid).collect { case Some(t) => t }
            user = User(token.email, ur.name, ur.referredBy)
            insertFut = users.insert(user)
            tokenFut = tokens.delete(uuid)
            _ <- insertFut
            _ <- tokenFut
          } yield {
            Ok(Json.obj("status" -> "created"))
          }
          fut recover { case _: NoSuchElementException => invalid }
        } getOrElse Future.successful(invalid)
      }
    )
  }

  case class UserRegistration(token: String, name: String, referredBy: Option[String])
}
