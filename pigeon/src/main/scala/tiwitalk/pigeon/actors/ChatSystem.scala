package tiwitalk.pigeon.actors

import akka.actor.{ Actor, ActorRef, Props, Terminated }
import akka.pattern.ask
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.Sentiment

import ChatHelpers._

class ChatSystem(sentiment: Sentiment) extends Actor {

  import context.dispatcher
  implicit val timeout = Timeout(1.second)

  // val context.actorOf(Props[UserService])

  def receive = state()

  def state(data: SystemData = SystemData()): Receive = {
    case Connect =>
      val ref = sender()
      val newUsers = data.users :+ ref
      context.watch(ref)
      stateChange(data.copy(users = newUsers))
    case m: UserMessage =>
      if (sentiment.enabled) {
        sentiment.analyze(m.message) onComplete {
          case util.Success(score) =>
            println(s"'${m.message}' = $score")
          case fail => println(fail)
        }
      }
      data.convos foreach (_.tell(m, sender()))
    case Disconnect =>
      data.convos foreach (_ forward Disconnect)
    case j: JoinConversation =>
      data.convos foreach (_ forward j)
    case StartConversation(ids) =>
      val id = UUID.randomUUID()
      val convActor = context.actorOf(Conversation.props(id))
      getIds(data.users) foreach { kp =>
        kp
          .collect {
            case (ref, uid) if ids contains uid => ref
          }
          .foreach { ref =>
            convActor.tell(JoinConversation(id), ref)
          }
      } 
      stateChange(data.copy(convos = data.convos :+ convActor))
    case GetUserInfo(Some(id)) =>
      val originalSender = sender()
      getIds(data.users) foreach { kp =>
        val refOpt = kp.collectFirst { case (ref, uid) if uid equals id => ref }
        refOpt foreach { ref =>
          (ref ? GetUserInfo(None)).mapTo[UserData] foreach { info =>
            originalSender ! info
          }
        }
      }
    case Terminated(ref) =>
      stateChange(data.copy(users = data.users.filterNot(_ != ref)))
  }

  @inline def stateChange(data: SystemData) = context.become(state(data))

  case class SystemData(
    users: Seq[ActorRef] = Seq.empty,
    convos: Seq[ActorRef] = Seq.empty
  )
}

object ChatSystem {
  def props(sentiment: Sentiment) = Props(new ChatSystem(sentiment))
}
