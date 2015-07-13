package tiwitalk.pigeon.service

import akka.actor.{ ActorRef, ActorSystem }
import akka.event.{ EventBus, LookupClassification }
import java.util.UUID
import scala.concurrent.Future
import scalacache._
import tiwitalk.pigeon.Chat.{ UserData, UpdateUserInfo }

class UserService(implicit cache: ScalaCache, system: ActorSystem)
    extends EventBus with LookupClassification {

  import system.dispatcher

  def fetchUserInfo(id: UUID): Future[Option[UserData]] = {
    get("USER-" + id)
  }

  def updateUserInfo(id: UUID, newData: UserData): Future[Unit] = {
    require(id equals newData.id)
    for (_ <- put("USER-" + id)(newData)) yield publish(UpdateUserInfo(newData))
  }

  def removeUserInfo(id: UUID): Future[Unit] = remove("USER-" + id)

  def fetchRef(id: UUID): Future[Option[ActorRef]] = {
    get("REF-" + id)
  }

  def updateRef(id: UUID, ref: ActorRef): Future[Unit] = put("REF-" + id)(ref)

  def removeRef(id: UUID): Future[Unit] = remove("REF-" + id)

  type Event = UpdateUserInfo
  type Subscriber = ActorRef
  type Classifier = UUID

  override protected def classify(event: Event) = event.data.id

  override protected def publish(event: Event, sub: Subscriber) = sub ! event

  override protected def compareSubscribers(a: Subscriber, b: Subscriber) = {
    a compareTo b
  }

  override protected def mapSize = 128
}
