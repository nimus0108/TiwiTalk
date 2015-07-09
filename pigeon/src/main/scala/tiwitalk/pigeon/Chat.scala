package tiwitalk.pigeon

import java.util.UUID

object Chat {
  sealed trait Event
  sealed trait InEvent extends Event
  sealed trait OutEvent extends Event
  sealed trait ServerEvent extends Event

  case object Connect extends InEvent
  case object Disconnect extends InEvent
  case class Message(message: String, room: UUID) extends InEvent
  case class StartConversation(users: Seq[UUID]) extends InEvent
  case class JoinConversation(id: UUID) extends InEvent
  case class InviteToConversation(id: UUID, users: Seq[UUID]) extends InEvent

  case class Broadcast(message: String) extends OutEvent
  case class RoomJoined(id: UUID) extends OutEvent
  case class UserData(
      id: UUID,
      name: String,
      availability: Int) extends OutEvent

  case object GetUserId extends ServerEvent
  case object GetName extends ServerEvent
  case object GetRoomId extends ServerEvent

  case object GetUserInfo extends InEvent with ServerEvent
  case object GetAvailability extends InEvent with ServerEvent
  case class SetAvailability(value: Int) extends InEvent
}
