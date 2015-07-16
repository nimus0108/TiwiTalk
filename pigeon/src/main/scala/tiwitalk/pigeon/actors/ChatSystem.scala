package tiwitalk.pigeon.actors

import akka.actor.{ Actor, ActorRef, Props, Terminated }
import akka.pattern.{ ask, pipe }
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.{ Sentiment, UserService }

import ChatHelpers._

class ChatSystem(sentiment: Sentiment, userService: UserService) extends Actor {

  import context.dispatcher
  implicit val timeout = Timeout(1.second)

  def receive = state()

  def state(data: SystemData = SystemData()): Receive = {
    case Connect(name) =>
      val userId = UUID.randomUUID()
      val defaultData = UserProfile(userId, name, 5)
      val userActor = context.actorOf(
        UserActor.props(defaultData, userService))
      val updateFut = userService.updateRef(userId, userActor) map { _ =>
        (userId -> userActor)
      }
      updateFut pipeTo sender
    case m: UserMessage =>
      data.rooms foreach (_.tell(m, sender()))
    case d @ Disconnect(id) =>
      data.rooms foreach (_ forward d)
      userService.removeRef(id)
    case i: InviteToRoom =>
      data.rooms foreach (_ forward i)
    case StartRoom(ids) =>
      val roomId = UUID.randomUUID()
      val roomActor = context.actorOf(
        RoomActor.props(roomId, userService, sentiment))
      roomActor ! JoinRoom(ids)
      sender() ! RoomStarted(roomId)
      stateChange(data.copy(rooms = data.rooms :+ roomActor))
    case GetUserProfile(Some(id)) =>
      val originalSender = sender()
      userService.fetchUserProfile(id) foreach { infoOpt =>
        infoOpt foreach (originalSender ! _)
      }
  }

  @inline def stateChange(data: SystemData) = context.become(state(data))

  case class SystemData(rooms: Seq[ActorRef] = Seq.empty)
}

object ChatSystem {
  def props(sentiment: Sentiment, userService: UserService) =
    Props(new ChatSystem(sentiment, userService))
}
