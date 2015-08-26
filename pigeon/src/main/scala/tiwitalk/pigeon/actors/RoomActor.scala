package tiwitalk.pigeon.actors

import akka.actor._
import akka.util.Timeout
import java.util.UUID
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.Future
import scala.concurrent.duration._
import tiwitalk.pigeon.Chat._
import tiwitalk.pigeon.service.{ RoomService, Sentiment, UserService }
import tiwitalk.pigeon.service.db.Metrics

import ChatHelpers._

class RoomActor(data: Room, userService: UserService, sentiment: Sentiment,
                roomService: RoomService, metrics: Metrics)
    extends Actor {
  import context.dispatcher
  implicit val timeout = Timeout(5.seconds)

  val id = data.id

  val chatLog = ArrayBuffer[UserMessage]()
  var lastAnalysis = System.currentTimeMillis()

  def receive = status(data)

  def status(room: Room): Receive = {
    // TODO: implement a dedicated actor for this
    case lastAnaly: Long => lastAnalysis = lastAnaly
    case msg: UserMessage =>
      // DEBUG: hide messages that aren't directed here
      if (msg.cid == id && room.users.contains(msg.user)) {
        chatLog += msg
        if (sentiment.enabled) {
          val now = System.currentTimeMillis()
          val submission =
            chatLog
              .toSeq
              .map(s => s.message.trim)
              .map(s => if (s.matches("^.*[\\.!?]$")) s else s + ".")
          if (submission.mkString(" ").split(" ").size > 35) {
            sentiment.analyze(submission.mkString(" ")) foreach { kp =>
              val score = kp._2
              val shades: Seq[Float] = Seq(
                (math.abs(score - 1)/2) * 255,
                (1 - (math.abs(score - 1)/2)) * 255,
                (1 - math.abs(score)) * 255
              )
              val colorCodes = shades.map(c => Integer.toHexString(c.toInt))
              val colCode =
                colorCodes.map(c => "".padTo(2 - c.size, "0").mkString + c)
              val color = MoodColor(room.id, "#" + colCode.mkString.toUpperCase)
              sendMessage(room.users, color)
              println(s"Submission '$submission': $score")
              self ! lastAnalysis
            }
            chatLog.clear()
          }
        }
        roomService.appendChatLog(id, Seq(msg)) foreach stateChange
        metrics.storeMetric(msg) onFailure { case x => x.printStackTrace() }
        sendMessage(room.users, msg)
      }
    case Disconnect(id) if room.users contains id =>
      sendMessage(room.users)(user =>
        Broadcast(room.id, s"${user.name} disconnected."))
    case InviteToRoom(_id, userIds) if _id equals id =>
      getData(sender()) foreach { userData =>
        if (room.users.contains(userData.id)) {
          addUsers(room, userIds)
        }
      }
    case JoinRoom(ids) =>
      addUsers(room, ids)
    case GetRoomId => sender() ! id
    case GetUsers => sender() ! room.users
    case shit =>
      println(s"[room ${room.id}] uncaught: $shit")
  }

  def sendMessage(users: Seq[UUID], event: OutEvent): Unit = {
    userService.fetchRefs(users) foreach { kps =>
      kps foreach (_._2 ! event)
    }
  }

  def sendMessage(users: Seq[UUID])(event: UserProfile => OutEvent): Unit = {
    users foreach { id =>
      val profileFut = userService.fetchUserProfile(id)
      val refFut = userService.fetchRef(id)
      for {
        profileOpt <- profileFut
        refOpt <- refFut
      } yield {
        profileOpt foreach (p => refOpt foreach (_ ! event(p)))
      }
    }
  }

  def addUsers(room: Room, users: Seq[UUID]) = {
    val newUsers = (room.users ++ users).distinct
    val addUserFut = roomService.addUsers(room.id, users)
    val uncacheFut =
      Future.sequence(users map (userService.uncacheUserAccount(_)))
    for {
      _ <- uncacheFut
      updatedRoom <- addUserFut
    } yield {
      stateChange(updatedRoom)
      sendMessage(users, RoomJoined(updatedRoom))
      userService.fetchUserProfiles(users) foreach { seq =>
        seq foreach { u =>
          val msg = Broadcast(room.id, s"${u.name} joined the conversation!")
          sendMessage(newUsers, msg)
        }
      }
    }
  }
  
  def stateChange(data: Room) = context.become(status(data))
}

object RoomActor {
  def props(data: Room, userService: UserService, sentiment: Sentiment, 
            roomService: RoomService, metrics: Metrics) =
    Props(new RoomActor(data, userService, sentiment, roomService, metrics))
}
