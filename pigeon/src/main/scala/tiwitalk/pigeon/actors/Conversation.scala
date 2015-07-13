package tiwitalk.pigeon.actors

import akka.actor._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.UserService

import ChatHelpers._

class Conversation(id: UUID, userService: UserService) extends Actor {
  import context.dispatcher
  implicit val timeout = Timeout(5.seconds)

  def receive = status(Data(Seq.empty))

  def status(data: Data): Receive = {
    case Message(msg, _id) if _id equals id =>
      if (data.users contains sender()) {
        userService.fetchUserInfo(id) onComplete { name =>
          sendMessage(data.users, Broadcast(s"[${id.toString}] $name: $msg"))
        }
      }
    case msg: UserMessage if msg.cid == id && data.users.contains(msg.user) =>
      sendMessage(data.users, msg)
    case Disconnect(id) if data.users contains sender() =>
      userService.fetchUserInfo(id) onComplete { case name =>
        sendMessage(data.users, Broadcast(s"$name disconnected."))
      }
    case InviteToConversation(_id, userIds) if _id equals id =>
      // TODO: implement
    case JoinConversation(_id) if _id equals id =>
      val originalSender = sender()
      getData(sender()) onSuccess {
        case userData if !data.users.contains(userData.id) =>
          val newUsers = data.users :+ userData.id
          originalSender ! RoomJoined(id)
          sendMessage(newUsers, Broadcast(s"${userData.name} joined the conversation!"))
          stateChange(data.copy(users = newUsers))
      }
    case GetRoomId => sender() ! id
    case GetUsers => sender() ! data.users
    case shit =>
      println(s"[conv $id] uncaught: $shit")
  }

  def sendMessage(users: Seq[UUID], event: OutEvent): Unit =
    userService.fetchRefs(users) onSuccess { case kps =>
      kps foreach (_._2 ! event)
    }

  case class Data(users: Seq[UUID], invites: Seq[UUID] = Seq.empty)
  
  @inline def stateChange(data: Data) = context.become(status(data))
}

object Conversation {
  def props(id: UUID, userService: UserService) =
    Props(new Conversation(id, userService))
}
