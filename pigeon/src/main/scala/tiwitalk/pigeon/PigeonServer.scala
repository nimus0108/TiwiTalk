package tiwitalk.pigeon

import akka.actor.{ ActorSystem, Props }
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import scala.util.Success

import actors.ChatSystem

object PigeonServer extends App {
  
  implicit val system = ActorSystem("pigeon")
  implicit val mat = ActorMaterializer()
  implicit val logging = Logging(system, "pigeon")
  implicit val execCtxt = system.dispatcher

  val host = "0.0.0.0"
  val port = 9876

  val chatSystem = system.actorOf(Props[ChatSystem], "chat")
  val routes = new Routes(chatSystem)

  val serverFuture = Http().bindAndHandle(routes.default, host, port)
  serverFuture onComplete {
    case Success(_) =>
      println("Server started")
    case _ =>
      println("Failed to start server")
      system.shutdown()
  }
}
