package tiwitalk.pigeon.service

import akka.actor.{ ActorRef, ActorSystem }
import akka.pattern.ask
import akka.util.Timeout
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import scalacache._
import tiwitalk.pigeon.Chat.{ Room, StartRoomRef, UserMessage }

class RoomService(db: DatabaseService)(implicit cache: ScalaCache,
    system: ActorSystem) {

  import system.dispatcher

  implicit val timeout: Timeout = 5.seconds

  def findRoom(id: UUID): Future[Option[Room]] = db.findRoom(id)

  def findRoomRef(id: UUID): Future[Option[ActorRef]] = {
    get[ActorRef]("ROOM-" + id) flatMap {
      case Some(r) => Future.successful(Some(r))
      case None =>
        db.findRoom(id) flatMap {
          case Some(room) =>
            val sel = system.actorSelection("/user/chat")
            (sel ? StartRoomRef(room)).mapTo[ActorRef] flatMap { r =>
              updateRoomRef(room.id, r) map (_ => Some(r))
            }
          case None => Future.successful(None)
        }
    }
  }

  def updateRoom(room: Room): Future[Unit] = db.updateRoom(room).map(_ => ())

  def updateRoomRef(id: UUID, ref: ActorRef): Future[Unit] = {
    put("ROOM-" + id)(ref)
  }

  def addUsers(id: UUID, user: Seq[UUID]): Future[Room] =
    db.addUsersToRoom(id, user)

  def appendChatLog(id: UUID, messages: Seq[UserMessage]): Future[Room] =
    db.appendChatLog(id, messages)
}
