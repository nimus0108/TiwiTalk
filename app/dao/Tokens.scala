package dao

import java.util.UUID
import javax.inject.{ Inject, Singleton }
import play.api.db.slick.{ DatabaseConfigProvider, HasDatabaseConfigProvider }
import slick.driver.JdbcProfile
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

import models.Token

trait TokensComponent { self: HasDatabaseConfigProvider[JdbcProfile] =>
  import driver.api._

  class Tokens(tag: Tag) extends Table[Token](tag, "tokens") {
    def email = column[String]("email", O.PrimaryKey)
    def token = column[UUID]("token", O.PrimaryKey)
    def created = column[Long]("created")
    def * = (email, token, created) <> (Token.tupled, Token.unapply _)
  }
}

@Singleton
class TokensDAO @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)
    extends TokensComponent with HasDatabaseConfigProvider[JdbcProfile]{
  import driver.api._

  val tokens = TableQuery[Tokens]

  def insert(token: Token): Future[Unit] =
    db.run(tokens += token).map(_ => ())

  def delete(token: UUID): Future[Int] =
    db.run(tokens.filter(_.token === token).delete)

  def deleteEmailToken(email: String): Future[Int] =
    db.run(tokens.filter(_.email === email).delete)

  def find(token: UUID): Future[Option[Token]] =
    db.run(tokens.filter(_.token === token).result).map(_.headOption)

  def all: Future[Seq[Token]] =
    db.run(tokens.map(identity).result)
}
