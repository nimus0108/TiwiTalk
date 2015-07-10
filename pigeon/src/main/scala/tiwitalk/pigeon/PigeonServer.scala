package tiwitalk.pigeon

import akka.actor.{ ActorSystem, Props }
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.typesafe.config.ConfigFactory
import scala.util.Success

import actors.ChatSystem

object PigeonServer extends App {

  val config = ConfigFactory.load()
  
  implicit val system = ActorSystem("pigeon")
  implicit val mat = ActorMaterializer()
  implicit val logging = Logging(system, "pigeon")
  implicit val execCtxt = system.dispatcher

  val host = config.getString("pigeon.host")
  val port = config.getInt("pigeon.port")

  val sentiment = new Sentiment(config.getBoolean("pigeon.sentiment.enabled"),
    config.getString("pigeon.sentiment.apiKey"))
  val chatSystem = system.actorOf(ChatSystem.props(sentiment), "chat")
  val routes = new Routes(chatSystem)

  val serverFuture = Http().bindAndHandle(routes.default, host, port)
  serverFuture onComplete {
    case Success(_) =>
      println(s"Server listening on $host, port $port")
    case _ =>
      println("Failed to start server")
      system.shutdown()
  }
}
