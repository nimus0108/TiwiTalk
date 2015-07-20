package tiwitalk.pigeon

import akka.actor.{ ActorSystem, ActorRef, Props }
import akka.event.LoggingAdapter
import akka.http.scaladsl._
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.ws.{ Message, TextMessage, UpgradeToWebsocket }
import akka.http.scaladsl.server.Directives._
import akka.pattern.ask
import akka.stream.ActorMaterializer
import akka.stream.actor.{ ActorPublisher, ActorSubscriber }
import akka.stream.scaladsl._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.util.{ Success, Try }
import upickle.default.{ read, write }

import actors.{ ChatSystem, UserActor }
import service.{ DatabaseService, UserService }

class Routes(chat: ActorRef, userService: UserService, db: DatabaseService)
    (implicit system: ActorSystem, mat: ActorMaterializer,
              logging: LoggingAdapter) {

  val default =
    logRequestResult("pigeon") {
      encodeResponse {
        (path("chat") & parameter('id)) { idStr =>
          extractRequest { req =>
            complete {
              lazy val fail = Future.successful(
                HttpResponse(400, entity = "Invalid websocket request"))

              val wsOpt = for {
                upgrade <- req.header[UpgradeToWebsocket]
                id <- Try(UUID.fromString(idStr)).toOption
              } yield {
                implicit val timeout: Timeout = 5.seconds
                (chat ? Chat.Connect(id)).mapTo[Option[ActorRef]] map {
                  case Some(ref) =>
                    userService.subscribe(ref, id)
                    upgrade.handleMessages(webSocketFlow(ref, id))
                  case None =>
                    HttpResponse(StatusCodes.NotFound)
                }
              }

              wsOpt match {
                case Some(f) => f
                case None => fail
              }
            }
          }
        } ~
        (path("register") & parameter('name)) { name =>
          post {
            complete {
              val id = UUID.randomUUID()
              val acc = Chat.UserAccount(id, Chat.UserProfile(id, name, 5))
              val msg = write(acc.profile)
              db.updateUserAccount(acc) map { _ =>
                HttpResponse(
                  status = StatusCodes.OK,
                  entity = HttpEntity(MediaTypes.`application/json`, msg)
                )
              }
            }
          }
        } ~
        pathSingleSlash {
          getFromResource("public/index.html")
        } ~
        getFromResourceDirectory("public")
      }
    }

  def webSocketFlow(userActor: ActorRef,
                    userId: UUID): Flow[Message, Message, Unit] = {
    val userIn = Sink(ActorSubscriber[Chat.InEvent](userActor))
    val userOut = Source(ActorPublisher[Chat.OutEvent](userActor))

    Flow() { implicit b =>
      import FlowGraph.Implicits._

      val msgToChat = b.add(Flow[Message]
        .collect {
          case TextMessage.Strict(s) => Try(read[Chat.InEvent](s))
        }
        .collect {
          case Success(s) => s
        }
      )
      val chatToMsg = b.add(Flow[Chat.OutEvent].map(s =>
        TextMessage.Strict(write(s))))
      val userFlow = b.add(Flow.wrap(userIn, userOut)((_, _) => ()))
      
      msgToChat ~> userFlow ~> chatToMsg

      (msgToChat.inlet, chatToMsg.outlet)
    }
  }
}
