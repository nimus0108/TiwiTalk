package tiwitalk.pigeon.actors

import akka.actor.ActorRef
import akka.util.Timeout
import akka.pattern.ask
import java.util.UUID
import scala.concurrent.{ ExecutionContext => ExecCtx, Future }
import tiwitalk.pigeon.Chat._

object ChatHelpers {

  def getData(ref: ActorRef)(implicit ec: ExecCtx, timeout: Timeout):
    Future[UserData] = (ref ? GetUserInfo(None)).mapTo[UserData]
}
