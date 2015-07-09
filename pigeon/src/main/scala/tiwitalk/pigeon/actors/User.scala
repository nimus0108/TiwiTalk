package tiwitalk.pigeon.actors

import akka.actor._
import akka.stream.actor._
import java.util.UUID
import tiwitalk.pigeon.Chat._

import ActorSubscriberMessage._

class UserActor(chat: ActorRef, initialData: UserData)
    extends ActorSubscriber with ActorPublisher[OutEvent] {

  def receive = handle(initialData)

  def handle(data: UserData): Receive = {
    case GetAvailability => sender ! data.availability
    case SetAvailability(value) => setAvailability(value, data)
    case GetUserId => sender ! data.id
    case GetName => sender ! data.name
    case Disconnect =>
      chat ! Disconnect
      self ! PoisonPill
    case e: OutEvent if totalDemand > 0 => onNext(e)
    case OnNext(GetUserInfo) if totalDemand > 0 =>
      onNext(data)
    case OnNext(SetAvailability(value)) => setAvailability(value, data)
    case OnNext(s) =>
      chat ! s
    case OnComplete => chat ! Disconnect
  }

  def setAvailability(value: Int, data: UserData) =
    context.become(handle(data.copy(availability = value)))

  override def requestStrategy = new WatermarkRequestStrategy(50)
}

object UserActor {
  def props(chat: ActorRef, id: UUID, name: String) =
    Props(new UserActor(chat, UserData(id, name, 5)))
}
