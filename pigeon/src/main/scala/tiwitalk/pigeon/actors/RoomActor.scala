package tiwitalk.pigeon.actors

import akka.actor._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.UserService

import ChatHelpers._

class Room(id: UUID, userService: UserService)
    extends Actor {
  import context.dispatcher
  implicit val timeout = Timeout(5.seconds)

  def receive = status(Seq.empty)

  def status(users: Seq[UUID]): Receive = {
    case msg: UserMessage if msg.cid == id && users.contains(msg.user) =>
      sendMessage(users, msg)
    case Disconnect(id) if users contains id =>
      sendMessage(users)(user => Broadcast(s"${user.name} disconnected."))
    case InviteToRoom(_id, userIds) if _id equals id =>
      getData(sender()) foreach { userData =>
        if (users.contains(userData.id)) {
          addUsers(users, userIds)
        }
      }
    case JoinRoom(ids) =>
      addUsers(users, ids)
    case GetRoomId => sender() ! id
    case GetUsers => sender() ! users
    case shit =>
      println(s"[room $id] uncaught: $shit")
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

  def addUsers(currentUsers: Seq[UUID], users: Seq[UUID]) = {
    val newUsers = (currentUsers ++ users).distinct
    sendMessage(users, RoomJoined(id))
    Future.sequence(users map userService.fetchUserInfo) foreach { seq =>
      seq collect {
        case Some(info) => info
      } foreach { u =>
        val msg = Broadcast(s"${u.name} joined the conversation!")
        sendMessage(newUsers, msg)
      }
    }
    stateChange(newUsers)
  }
  
  @inline def stateChange(data: Seq[UUID]) = context.become(status(data))
}

object Room {
  def props(id: UUID, userService: UserService) =
    Props(new Room(id, userService))
}
