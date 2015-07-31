package dao

import javax.inject.{ Inject, Singleton }
import play.api.db.slick.{ DatabaseConfigProvider, HasDatabaseConfigProvider }
import slick.driver.JdbcProfile
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

import models.User

trait UsersComponent { self: HasDatabaseConfigProvider[JdbcProfile] =>
  import driver.api._

  class Users(tag: Tag) extends Table[User](tag, "users") {
    def email = column[String]("email", O.PrimaryKey)
    def name = column[String]("name")
    def referredBy = column[Option[String]]("referred_by")
    def * = (email, name, referredBy) <> (User.tupled, User.unapply _)
  }
}

@Singleton
class UsersDAO @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)
    extends UsersComponent with HasDatabaseConfigProvider[JdbcProfile]{
  import driver.api._

  val users = TableQuery[Users]

  def insert(user: User): Future[Unit] =
    db.run(users += user).map(_ => ())

  def insert(users: Seq[User]): Future[Unit] =
    db.run(this.users ++= users).map(_ => ())

  def all: Future[Seq[User]] = {
    val query = users map identity
    db.run(query.result)
  }

  def find(email: String): Future[Option[User]] = {
    val query = for (user <- users if user.email === email) yield user
    db.run(query.result).map(_.headOption)
  }
}
