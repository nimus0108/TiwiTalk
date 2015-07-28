package tiwitalk.pigeon.actors

import akka.actor.{ Actor, ActorRef, Props, Terminated }
import akka.pattern.{ ask, pipe }
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.{ RoomService, Sentiment, UserService }

import ChatHelpers._

class ChatSystem(sentiment: Sentiment, userService: UserService,
                 roomService: RoomService) extends Actor {

  import context.dispatcher
  implicit val timeout = Timeout(1.second)

  def receive = state

  def state: Receive = {
    case Connect(id) =>
      val s = sender()
      userService.fetchUserAccount(id) map {
        case Some(user) =>
          val ref = context.actorOf(UserActor.props(user, userService))
          userService.updateRef(id, ref)
          userService.subscribe(ref, id)
          Some(ref)
        case None => None
      } pipeTo s
    case m: UserMessage =>
      sendToRoom(m.cid)(_ ! m)
    case d @ Disconnect(id) =>
      sendToRoom(id)(_ forward d)
      userService.removeRef(id)
    case i: InviteToRoom =>
      sendToRoom(i.id)(_ forward i)
    case StartRoomRef(room) =>
      sender ! context.actorOf(
        RoomActor.props(room, userService, sentiment, roomService))
    case StartRoom(ids) =>
      val sendr = sender()
      val roomId = UUID.randomUUID()
      val room = Room(roomId, Seq.empty)
      roomService.updateRoom(room) foreach { _ =>
        val roomActor = context.actorOf(
          RoomActor.props(room, userService, sentiment, roomService))
        roomActor ! JoinRoom(ids)
        sendr ! RoomStarted(roomId)
      }
    case GetUserProfile(Some(id)) =>
      val originalSender = sender()
      val fut = userService.fetchUserProfile(id) collect { case Some(x) => x }
      fut pipeTo originalSender
    case GetRoomInfo(id) =>
      val originalSender = sender()
      val fut = roomService.findRoom(id) collect { case Some(x) => x }
      fut pipeTo originalSender
    case SearchForUser(name) if !name.trim.isEmpty =>
      userService.searchUsersByName(name.trim) map { accs =>
        UserSearchResult(name, accs map (_.profile))
      } pipeTo sender()
  }

  def sendToRoom(id: UUID)(block: ActorRef => Unit): Future[Unit] = {
    roomService.findRoomRef(id) map {
      case Some(r) => block(r)
      case _ =>
    }
  }
}

object ChatSystem {
  def props(sentiment: Sentiment, userService: UserService,
            roomService: RoomService) =
    Props(new ChatSystem(sentiment, userService, roomService))
}
