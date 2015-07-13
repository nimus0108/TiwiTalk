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
      val defaultData = UserData(userId, name, 5)
      val userActor = context.actorOf(
        UserActor.props(defaultData, userService))
      val updateFut = userService.updateRef(userId, userActor) map { _ =>
        (userId -> userActor)
      }
      updateFut pipeTo sender
    case m: UserMessage =>
      if (sentiment.enabled) {
        sentiment.analyze(m.message) onComplete {
          case util.Success(score) =>
            println(s"'${m.message}' = $score")
          case fail => println(fail)
        }
      }
      data.convos foreach (_.tell(m, sender()))
    case d @ Disconnect(id) =>
      data.convos foreach (_ forward d)
      userService.removeRef(id)
    case i: InviteToConversation =>
      data.convos foreach (_ forward i)
    case StartConversation(ids) =>
      val convId = UUID.randomUUID()
      val convActor = context.actorOf(Conversation.props(convId, userService))
      convActor ! JoinConversation(ids)
      sender() ! ConversationStarted(convId)
      stateChange(data.copy(convos = data.convos :+ convActor))
    case GetUserInfo(Some(id)) =>
      val originalSender = sender()
      userService.fetchUserInfo(id) foreach { infoOpt =>
        infoOpt foreach (originalSender ! _)
      }
  }

  @inline def stateChange(data: SystemData) = context.become(state(data))

  case class SystemData(convos: Seq[ActorRef] = Seq.empty)
}

object ChatSystem {
  def props(sentiment: Sentiment, userService: UserService) =
    Props(new ChatSystem(sentiment, userService))
}
