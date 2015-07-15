package tiwitalk.pigeon.actors

import akka.actor._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.UserService

import ChatHelpers._

class RoomActor(id: UUID, userService: UserService)
    extends Actor {
  import context.dispatcher
  implicit val timeout = Timeout(5.seconds)

  def receive = status(Room(id, Seq.empty))

  def status(room: Room): Receive = {
    case msg: UserMessage =>
      // DEBUG: hide messages that aren't directed here
      if (msg.cid == id && room.users.contains(msg.user)) {
        sendMessage(room.users, msg)
      }
    case Disconnect(id) if room.users contains id =>
      sendMessage(room.users)(user => Broadcast(s"${user.name} disconnected."))
    case InviteToRoom(_id, userIds) if _id equals id =>
      getData(sender()) foreach { userData =>
        if (room.users.contains(userData.id)) {
          addUsers(room, userIds)
        }
      }
    case JoinRoom(ids) =>
      addUsers(room, ids)
    case GetRoomId => sender() ! id
    case GetUsers => sender() ! room.users
    case shit =>
      println(s"[room ${room.id}] uncaught: $shit")
  }

  def sendMessage(users: Seq[UUID], event: OutEvent): Unit =
    userService.fetchRefs(users) foreach { kps =>
      kps foreach (_._2 ! event)
    }

  def sendMessage(users: Seq[UUID])(event: UserData => OutEvent): Unit = {
    users foreach { id =>
      val infoFut = userService.fetchUserInfo(id)
      val refFut = userService.fetchRef(id)
      for {
        infoOpt <- infoFut
        refOpt <- refFut
      } yield {
        infoOpt foreach (info => refOpt foreach (_ ! event(info)))
      }
    }
  }

  def addUsers(room: Room, users: Seq[UUID]) = {
    val newUsers = (room.users ++ users).distinct
    val updatedRoom = room.copy(users = newUsers)
    sendMessage(users, RoomJoined(updatedRoom))
    Future.sequence(users map userService.fetchUserInfo) foreach { seq =>
      seq collect {
        case Some(info) => info
      } foreach { u =>
        val msg = Broadcast(s"${u.name} joined the conversation!")
        sendMessage(newUsers, msg)
      }
    }
    stateChange(updatedRoom)
  }
  
  @inline def stateChange(data: Room) = context.become(status(data))
}

object RoomActor {
  def props(id: UUID, userService: UserService) =
    Props(new RoomActor(id, userService))
}
