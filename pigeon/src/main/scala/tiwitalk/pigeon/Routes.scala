package tiwitalk.pigeon

import akka.actor.{ ActorSystem, ActorRef, Props }
import akka.event.LoggingAdapter
import akka.http.scaladsl._
import akka.http.scaladsl.model.ws.{ Message, TextMessage }
import akka.http.scaladsl.server.Directives._
import akka.pattern.ask
import akka.stream.ActorMaterializer
import akka.stream.actor.{ ActorPublisher, ActorSubscriber }
import akka.stream.scaladsl._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import upickle.default.{ read, write }

import actors.{ ChatSystem, UserActor }
import service.UserService

class Routes(chat: ActorRef, userService: UserService)
    (implicit system: ActorSystem, mat: ActorMaterializer,
              logging: LoggingAdapter) {

  val default =
    logRequestResult("pigeon") {
      encodeResponse {
        (path("chat") & parameter('name)) { name =>
          handleWebsocketMessages(webSocketFlow(name))
        } ~
        pathSingleSlash {
          getFromResource("web/index.html")
        } ~
        getFromResourceDirectory("web")
      }
    }

  def webSocketFlow(name: String): Flow[Message, Message, Unit] = {
    // TODO: don't block
    import scala.concurrent.Await, scala.concurrent.duration._
    implicit val timeout: Timeout = 1.second
    val userFut = (chat ? Chat.Connect(name)).mapTo[(UUID, ActorRef)]
    val (userId, userActor) = Await.result(userFut, timeout.duration)
    val userIn = Sink(ActorSubscriber[Chat.InEvent](userActor))
    val userOut = Source(ActorPublisher[Chat.OutEvent](userActor))

    userService.subscribe(userActor, userId)

    Flow() { implicit b =>
      import FlowGraph.Implicits._

      val msgToChat = b.add(Flow[Message].collect {
        case TextMessage.Strict(s) => read[Chat.InEvent](s)
      })
      val chatToMsg = b.add(Flow[Chat.OutEvent].map(s =>
        TextMessage.Strict(write(s))))
      val userFlow = b.add(Flow.wrap(userIn, userOut)((_, _) => ()))
      
      msgToChat ~> userFlow ~> chatToMsg

      (msgToChat.inlet, chatToMsg.outlet)
    }
  }
}
