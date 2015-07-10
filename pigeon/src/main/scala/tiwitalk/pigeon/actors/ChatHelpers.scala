package tiwitalk.pigeon.actors

import akka.actor.ActorRef
import akka.util.Timeout
import akka.pattern.ask
import java.util.UUID
import scala.concurrent.{ ExecutionContext => ExecCtx, Future }
import tiwitalk.pigeon.Chat._

object ChatHelpers {

  def getData(ref: ActorRef)(implicit ec: ExecCtx, timeout: Timeout):
    Future[UserData] = (ref ? GetUserInfo).mapTo[UserData]
  
  def getData(refs: Seq[ActorRef])(implicit ec: ExecCtx, timeout: Timeout):
    Future[Seq[(ActorRef, UserData)]] =
      Future.sequence(refs map (r => getData(r) map (r -> _)))

  def getName(ref: ActorRef)(implicit ec: ExecCtx, timeout: Timeout) =
    (ref ? GetName).mapTo[String]

  def getId(ref: ActorRef)(implicit ec: ExecCtx, timeout: Timeout) =
    (ref ? GetUserId).mapTo[UUID]

  def broadcast(users: Seq[ActorRef], event: OutEvent): Unit =
    users foreach (_ ! event)

  def getNames(refs: Seq[ActorRef])(implicit ec: ExecCtx, timeout: Timeout) =
    Future.sequence(refs map (r => getName(r) map (r -> _)))

  def getIds(refs: Seq[ActorRef])(implicit ec: ExecCtx, timeout: Timeout) =
    Future.sequence(refs map (r => getId(r) map (r -> _)))
}