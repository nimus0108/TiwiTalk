package controllers

import java.util.{ NoSuchElementException, UUID }
import javax.inject.{ Inject, Singleton }
import play.api.mvc._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try
import dao._
import models._

trait DashboardSecurity {

  def users: UsersDAO

  val Secured = new SecuredActionBuilder(users)
}

case class SecuredRequest[A](val user: User, request: Request[A])
    extends WrappedRequest[A](request)

class SecuredActionBuilder(users: UsersDAO)
    extends ActionBuilder[SecuredRequest] {

  override def invokeBlock[A](
      request: Request[A],
      block: (SecuredRequest[A]) => Future[Result]): Future[Result] = {

    lazy val failed = Future.successful(Results.NotFound(views.html.index()))
    val opt: Option[Future[Result]] = for {
      tokenStr <- request.queryString.get("user") flatMap (_.headOption)
      token <- Try(UUID.fromString(tokenStr)).toOption
    } yield {
      users.findByCode(token) flatMap {
        case Some(u) => block(SecuredRequest(u, request))
        case _ => failed
      }
    }
    
    opt getOrElse failed
  }
}
