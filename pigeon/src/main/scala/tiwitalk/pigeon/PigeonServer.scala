package tiwitalk.pigeon

import akka.actor.{ ActorSystem, Props }
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.typesafe.config.ConfigFactory
import scala.util.Success
import scalacache._
import scalacache.guava._

import actors.ChatSystem
import service.{ Sentiment, UserService }

object PigeonServer extends App {

  val config = ConfigFactory.load()
  
  implicit val system = ActorSystem("pigeon")
  implicit val mat = ActorMaterializer()
  implicit val logging = Logging(system, "pigeon")
  implicit val execCtxt = system.dispatcher
  implicit val scalaCache = ScalaCache(GuavaCache())

  val host = config.getString("pigeon.host")
  val port = config.getInt("pigeon.port")

  val sentiment = new Sentiment(config.getBoolean("pigeon.sentiment.enabled"),
    config.getString("pigeon.sentiment.apiKey"))
  val userService = new UserService

  val chatSystem = system.actorOf(ChatSystem.props(sentiment, userService), "chat")
  val routes = new Routes(chatSystem, userService)

  val serverFuture = Http().bindAndHandle(routes.default, host, port)
  serverFuture onComplete {
    case Success(_) =>
      println(s"Server listening on $host, port $port")
    case _ =>
      println("Failed to start server")
      system.shutdown()
  }
}
