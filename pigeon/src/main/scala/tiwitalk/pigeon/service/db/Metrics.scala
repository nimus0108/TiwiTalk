package tiwitalk.pigeon.service.db

import reactivemongo.api._
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson._
import java.time.{ Clock, Instant, ZonedDateTime, ZoneId }
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import tiwitalk.pigeon.Chat._

import MongoModels._

trait Metrics {

  implicit val modelHandler = Macros.handler[UserMetric]

  def metricsCol: BSONCollection

  def storeMetric(msg: UserMessage): Future[Unit] = {
    val date = ZonedDateTime.ofInstant(
      Instant.ofEpochMilli(msg.timestamp), ZoneId.of("UTC"))
    val dateDoc =
      BSONDocument(
        "day" -> date.getDayOfMonth,
        "month" -> date.getMonth.getValue,
        "year" -> date.getYear)
    val upd =
      BSONDocument(
        "$setOnInsert" -> dateDoc,
        "$push" -> BSONDocument(
          "messages" -> UserMetric(msg.timestamp, msg.user, msg.cid)
        )
      )

    metricsCol.update(dateDoc, upd, upsert = true) map (_ => ())
  }

  case class DateMetric(
    year: Int,
    month: Int,
    day: Int,
    messages: Seq[UserMetric])
  case class UserMetric(timestamp: Long, user: UUID, room: UUID)
}
