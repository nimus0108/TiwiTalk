package controllers

import java.util.UUID
import java.time.Clock
import javax.inject.Inject
import org.postgresql.util.PSQLException
import play.api._
import play.api.data.Form
import play.api.data.Forms.{ mapping, nonEmptyText, optional, text }
import play.api.i18n.{ I18nSupport, MessagesApi }
import play.api.libs.json._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.mvc._
import scala.concurrent.Future
import scala.util.Try

import dao._
import models._
import models.Models._

class Application @Inject()(users: UsersDAO, tokens: TokensDAO,
    val messagesApi: MessagesApi) extends Controller with I18nSupport {

  val userForm = Form(
    mapping(
      "email" -> nonEmptyText,
      "name" -> nonEmptyText,
      "referredBy" -> optional(text)
    )(User.apply)(User.unapply)
  )

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def all = Action.async {
    users.all map { all =>
      val reply = Json.obj("status" -> "ok", "users" -> Json.toJson(all))
      Ok(reply)
    }
  }

  def insert = Action.async { implicit request =>
    val fut = userForm.bindFromRequest.fold(
      errorForm => {
        val reply = Json.obj(
          "status" -> "error",
          "errors" -> errorForm.errorsAsJson)
        Future.successful(BadRequest(reply))
      },
      user => {
        users.insert(user) map (_ => Ok(Json.obj("status" -> "created")))
      }
    )

    fut recover {
      case e: PSQLException if e.getSQLState == "23505" =>
        Conflict(Json.obj("status" -> "conflict"))
    }
  }

  def generateToken = Action.async {
    val token = UUID.randomUUID
    val time = Clock.systemUTC.millis
    tokens.insert(Token(token, time)) map { _ =>
      Ok(Json.obj("token" -> token))
    }
  }

  def verifyToken(token: String) = Action.async { implicit request =>
    lazy val invalid = NotFound(Json.obj("status" -> "invalid"))
    Try(UUID.fromString(token)) map { uuid =>
      tokens.find(uuid) map {
        case Some(_) => Ok(Json.obj("status" -> "valid"))
        case None => invalid
      }
    } getOrElse Future.successful(invalid)
  }

}
