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
import reactivemongo.api.commands.CommandError
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
        (path("chat") & parameter('email)) { email =>
          extractRequest { req =>
            complete {
              lazy val fail = Future.successful(
                HttpResponse(400, entity = "Invalid websocket request"))

              val wsOpt = req.header[UpgradeToWebsocket] map { upgrade =>
                val accFut = db.findUserAccountByEmail(email) collect {
                  case Some(acc) => acc
                } 
                implicit val timeout: Timeout = 5.seconds
                for {
                  acc <- accFut
                  ref <- (chat ? Chat.Connect(acc.id))
                           .collect { case Some(ref: ActorRef) => ref }
                } yield {
                  userService.subscribe(ref, acc.id)
                  upgrade.handleMessages(webSocketFlow(ref))
                }
              }

              wsOpt match {
                case Some(fut) =>
                  fut recover { case _ => HttpResponse(StatusCodes.NotFound) }
                case None =>
                  fail
              }
            }
          }
        } ~
        (path("register") & parameter('name) & parameter('email)) {
          (name, email) =>
            post {
              complete {
                val id = UUID.randomUUID()
                val prof = Chat.UserProfile.default(id, name)
                val acc = Chat.UserAccount(id, email, prof)
                db.updateUserAccount(acc) map { _ =>
                  HttpResponse(
                    status = StatusCodes.OK,
                    entity = HttpEntity(
                      MediaTypes.`application/json`,
                      write(ApiResponse("ok", Some(acc.profile)))
                    )
                  )
                } recover {
                  case e: CommandError
                    if e.code.isDefined && e.code.get == 11000 => 
                      HttpResponse(
                        status = StatusCodes.Conflict,
                        entity = HttpEntity(
                          MediaTypes.`application/json`, 
                          write[ApiResponse[String]](ApiResponse("conflict"))
                        )
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

  def webSocketFlow(userActor: ActorRef): Flow[Message, Message, Unit] = {
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

  case class ApiResponse[T](status: String, data: Option[T] = None)
}
