package tiwitalk.pigeon

import java.util.UUID

object Chat {
  sealed trait Event
  sealed trait InEvent extends Event
  sealed trait OutEvent extends Event
  sealed trait ServerEvent extends Event

  case class Message(message: String, room: UUID) extends InEvent
  case class StartRoom(users: Seq[UUID]) extends InEvent
  case class InviteToRoom(id: UUID, users: Seq[UUID]) extends InEvent
  case class GetUserInfo(id: Option[UUID]) extends InEvent with ServerEvent
  case object GetAvailability extends InEvent with ServerEvent
  case class SetAvailability(value: Int) extends InEvent

  case class Broadcast(message: String) extends OutEvent
  case class UserMessage(
    user: UUID,
    message: String,
    cid: UUID) extends OutEvent
  case class RoomInvite(id: UUID) extends OutEvent
  case class RoomJoined(id: UUID) extends OutEvent with ServerEvent
  case class UserData(
      id: UUID,
      name: String,
      availability: Int,
      rooms: Seq[UUID] = Seq.empty) extends OutEvent

  case class Connect(name: String) extends ServerEvent
  case class Disconnect(id: UUID) extends ServerEvent
  case object GetUserId extends ServerEvent
  case object GetName extends ServerEvent
  case object GetRoomId extends ServerEvent
  case object GetUsers extends ServerEvent
  case object GetRooms extends ServerEvent
  case class JoinRoom(ids: Seq[UUID]) extends ServerEvent
  case class UpdateUserInfo(data: UserData) extends ServerEvent
  case class RoomStarted(id: UUID) extends ServerEvent
}
