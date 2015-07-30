package tiwitalk.pigeon

import akka.actor.{ ActorSystem, Props }
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.typesafe.config.ConfigFactory
import scala.util.{ Failure, Success }
import scalacache._
import scalacache.guava._

import actors.ChatSystem
import service._

object PigeonServer extends App {

  val config = ConfigFactory.load()
  val databaseService = new DatabaseService(config)
  
  implicit val system = ActorSystem("pigeon")
  implicit val mat = ActorMaterializer()
  implicit val logging = Logging(system, "pigeon")
  implicit val execCtxt = system.dispatcher
  implicit val scalaCache = ScalaCache(GuavaCache())

  val host = config.getString("pigeon.host")
  val port = config.getInt("pigeon.port")

  val sentiment = new Sentiment(config.getBoolean("pigeon.sentiment.enabled"),
    config.getString("pigeon.sentiment.apiKey"))
  val userService = new UserService(databaseService)
  val roomService = new RoomService(databaseService)
  val authService = new AuthService(config.getString("pigeon.parse.apiKey"),
    config.getString("pigeon.parse.appId"))

  val chatSystem = system.actorOf(ChatSystem.props(
    sentiment, userService, roomService, databaseService), "chat")
  val routes = new Routes(chatSystem, userService, databaseService, authService)

  // Intentionally not parallel
  val startFuture = for {
    _ <- databaseService.init()
    res <- Http().bindAndHandle(routes.default, host, port)
  } yield res

  startFuture onComplete {
    case Success(_) =>
      println(s"Server listening on $host, port $port")
    case Failure(e) =>
      println("Failed to start server")
      e.printStackTrace()
      system.shutdown()
  }
}
