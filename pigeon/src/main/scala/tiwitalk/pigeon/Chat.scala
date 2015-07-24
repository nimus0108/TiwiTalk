package tiwitalk.pigeon

import java.util.UUID
import reactivemongo.bson.Macros.Annotations.Key

object Chat {
  sealed trait Event
  sealed trait InEvent extends Event
  sealed trait OutEvent extends Event
  sealed trait ServerEvent extends Event

  case class Message(message: String, room: UUID) extends InEvent
  case class StartRoom(users: Seq[UUID]) extends InEvent
  case class InviteToRoom(id: UUID, users: Seq[UUID]) extends InEvent
  case class GetUserProfile(id: Option[UUID]) extends InEvent with ServerEvent
  case class GetRoomInfo(id: UUID) extends InEvent
  case object GetAvailability extends InEvent with ServerEvent
  case class SetAvailability(value: Int) extends InEvent
  case class SetStatus(value: String) extends InEvent
  case object GetUserAccount extends InEvent
  case class SearchForUser(name: String) extends InEvent
  case class ModifyContacts(add: Seq[UUID], remove: Seq[UUID]) extends InEvent

  case class Broadcast(room: UUID, message: String) extends OutEvent
  case class UserMessage(
    user: UUID,
    message: String,
    cid: UUID) extends OutEvent
  case class RoomInvite(id: UUID) extends OutEvent
  case class RoomJoined(room: Room) extends OutEvent with ServerEvent
  case class UserAccount(
      @Key("_id") id: UUID,
      profile: UserProfile,
      rooms: Seq[UUID] = Seq.empty,
      contacts: Seq[UUID] = Seq.empty) extends OutEvent
  case class UserProfile(
      id: UUID,
      name: String,
      availability: Int,
      status: String) extends OutEvent
  case class Room(@Key("_id") id: UUID, users: Seq[UUID]) extends OutEvent
  case class MoodColor(room: UUID, color: String) extends OutEvent
  case class UserSearchResult(query: String, results: Seq[UserProfile])
      extends OutEvent

  object UserProfile {
    def default(id: UUID, name: String): UserProfile =
      UserProfile(id, name, availability = 5, status = "")
  }

  case class Connect(id: UUID) extends ServerEvent
  case class Disconnect(id: UUID) extends ServerEvent
  case object GetUserId extends ServerEvent
  case object GetName extends ServerEvent
  case object GetRoomId extends ServerEvent
  case object GetUsers extends ServerEvent
  case object GetRooms extends ServerEvent
  case class JoinRoom(ids: Seq[UUID]) extends ServerEvent
  case class UpdateUserAccount(data: UserAccount) extends ServerEvent
  case class RoomStarted(id: UUID) extends ServerEvent
  case class StartRoomRef(room: Room) extends ServerEvent

}
