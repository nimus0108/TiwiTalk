package tiwitalk.pigeon.actors

import akka.actor._
import akka.stream.actor._
import java.time.Clock
import java.util.UUID
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.UserService

import ActorSubscriberMessage._

class UserActor(initialData: UserAccount, userService: UserService)
    extends ActorSubscriber with ActorPublisher[OutEvent] {

  def receive = handle(initialData)

  def handle(data: UserAccount): Receive = {
    case UpdateUserAccount(newData) if data.id equals newData.id =>
      if (!(newData equals data)) {
        context.become(handle(newData))
        if (totalDemand > 0) onNext(newData)
      }
    case GetAvailability => sender ! data.profile.availability
    case SetAvailability(value) => setAvailability(value, data.profile)
    case GetUserId => sender ! data.id
    case GetName => sender ! data.profile.name
    case Disconnect =>
      context.parent ! Disconnect
      self ! PoisonPill
    case r @ RoomJoined(room) if totalDemand > 0 =>
      onNext(r)
    case e: OutEvent if totalDemand > 0 => onNext(e)
    case GetUserProfile(None) if totalDemand > 0 => sender() ! data.profile
    case OnNext(GetUserProfile(None)) if totalDemand > 0 => onNext(data.profile)
    case OnNext(GetUserAccount) if totalDemand > 0 => onNext(data)
    case OnNext(SetStatus(value)) if totalDemand > 0 =>
      if (!(value equals data.profile.status)) {
        userService.updateUserStatus(data.id, value)
      }
    case OnNext(m @ Message(msg, cid)) if data.rooms.contains(cid) =>
      val trimmed = msg.trim
      if (trimmed.length > 0) {
        val ts = Clock.systemUTC.millis
        context.parent ! UserMessage(data.id, trimmed, cid, ts)
      }
    case OnNext(StartRoom(ids)) =>
      context.parent ! StartRoom((ids :+ data.id).distinct)
    case OnNext(SetAvailability(value)) => setAvailability(value, data.profile)
    case OnNext(m @ ModifyContacts(add, rm)) =>
      userService.modifyContacts(data.id, (add ++ data.contacts).distinct, rm)
    case OnNext(s) => context.parent ! s
    case OnComplete => context.parent ! Disconnect(data.id)
  }

  def setAvailability(value: Int, data: UserProfile) =
    userService.updateUserProfile(data.copy(availability = value))

  override def requestStrategy = new WatermarkRequestStrategy(50)
}

object UserActor {
  def props(account: UserAccount, userService: UserService): Props =
    Props(new UserActor(account, userService))
}
