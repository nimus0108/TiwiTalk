package tiwitalk.pigeon.actors

import akka.actor._
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._

import ChatHelpers._

class Conversation(id: UUID) extends Actor {
  import context.dispatcher
  implicit val timeout = Timeout(5.seconds)

  def receive = status(Data(Seq.empty))

  def status(data: Data): Receive = {
    case Message(msg, _id) if _id == id && data.users.contains(sender()) =>
      getName(sender()) foreach { name =>
        broadcast(data.users, Broadcast(s"[${id.toString}] $name: $msg"))
      }
    case Disconnect if data.users contains sender() =>
      getName(sender()) foreach { name =>
        broadcast(data.users, Broadcast(s"$name disconnected."))
      }
    case InviteToConversation(_id, name) if _id == id =>
      for {
        name <- getName(sender()) if !data.invites.contains(name)
      } yield {
        stateChange(data.copy(invites = data.invites :+ name))
      }
    case JoinConversation(_id) if _id == id && !data.users.contains(sender()) =>
      val newUsers = data.users :+ sender()
      sender() ! RoomJoined(id)
      getName(sender()) foreach { name =>
        broadcast(newUsers, Broadcast(s"$name joined the conversation!"))
      }
      stateChange(data.copy(users = newUsers))
    case GetRoomId => sender() ! id
    case shit =>
      println(s"[$id] uncaught: $shit")
  }

  def sendMessage(users: Seq[ActorRef], event: OutEvent): Unit =
    users foreach (_ ! event)

  case class Data(users: Seq[ActorRef], invites: Seq[String] = Seq.empty)
  
  @inline def stateChange(data: Data) = context.become(status(data))
}

object Conversation {
  def props(id: UUID) = Props(new Conversation(id))
}
