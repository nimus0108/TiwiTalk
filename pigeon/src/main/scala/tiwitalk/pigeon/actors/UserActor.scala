package tiwitalk.pigeon.actors

import akka.actor._
import akka.stream.actor._
import java.util.UUID
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.UserService

import ActorSubscriberMessage._

class UserActor(initialData: UserData, userService: UserService)
    extends ActorSubscriber with ActorPublisher[OutEvent] {

  override def preStart(): Unit = {
    userService.updateUserInfo(initialData)
  }

  def receive = handle(initialData)

  def handle(data: UserData): Receive = {
    case UpdateUserInfo(newData) if data.id equals newData.id =>
      context.become(handle(newData))
    case GetAvailability => sender ! data.availability
    case SetAvailability(value) => setAvailability(value, data)
    case GetUserId => sender ! data.id
    case GetName => sender ! data.name
    case Disconnect =>
      context.parent ! Disconnect
      self ! PoisonPill
    case r @ RoomJoined(room) if totalDemand > 0 =>
      onNext(r)
      val newData = data.copy(rooms = data.rooms :+ room.id)
      userService.updateUserInfo(newData)
    case e: OutEvent if totalDemand > 0 => onNext(e)
    case GetUserInfo(None) if totalDemand > 0 => sender() ! data
    case OnNext(GetUserInfo(None)) if totalDemand > 0 => onNext(data)
    case OnNext(m @ Message(msg, cid)) if data.rooms.contains(cid) =>
      context.parent ! UserMessage(data.id, msg, cid)
    case OnNext(SetAvailability(value)) => setAvailability(value, data)
    case OnNext(s) => context.parent ! s
    case OnComplete => context.parent ! Disconnect(data.id)
  }

  def setAvailability(value: Int, data: UserData) =
    userService.updateUserInfo(data.copy(availability = value))

  override def requestStrategy = new WatermarkRequestStrategy(50)
}

object UserActor {
  def props(data: UserData, userService: UserService): Props =
    Props(new UserActor(data, userService))

  def props(id: UUID, name: String, userService: UserService): Props =
    props(UserData(id, name, 5), userService)
}
