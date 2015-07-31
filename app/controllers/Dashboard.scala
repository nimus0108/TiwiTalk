package controllers

import javax.inject.Inject
import play.api._
import play.api.libs.json._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.mvc._
import scala.concurrent.Future

import dao._
import models._
import models.Models._

class Dashboard @Inject()(users: UsersDAO) extends Controller {

  def referrals(email: String) = Action.async {
    users.referredBy(email) map { r =>
      Ok(Json.obj("referrals" -> r.map(_.email)))
    }
  }

  def rankings = Action.async {
    users.referralCount map { refMap =>
      val refs = refMap map (kp => Json.obj(kp._1 -> kp._2))
      Ok(Json.obj("rankings" -> refs))
    }
  }
}
