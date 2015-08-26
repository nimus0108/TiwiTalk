package tiwitalk.empath

import epic.models.{ NerSelector, ParserSelector, PosTagSelector }
import epic.parser.Parser
import epic.preprocess
import epic.sequences.CRF
import epic.trees.AnnotatedLabel
import scala.concurrent.{ Await, Future }
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration

object EpicTest {
  def main(args: Array[String]): Unit = {
    println("Loading...")
    val parserFuture = Future(ParserSelector.loadParser("en").get)
    val taggerFuture = Future(PosTagSelector.loadTagger("en").get)
    val runFuture = for {
      parser <- parserFuture
      tagger <- taggerFuture
    } yield runTests(parser, tagger)

    Await.ready(runFuture, Duration.Inf)
  }

  def runTests(parser: Parser[AnnotatedLabel, String],
               tagger: CRF[AnnotatedLabel, String]): Unit = {
    val text =
      """
      The lazy dog tried jumped over the sleeping fox, but it impaled itself.
      Then the fox woke up and ate the dog.
      """.stripMargin

    println("processing text")
    val tokens = preprocess.preprocess(text)

    tokens.par.map(s => parser(s) -> s).seq map { case (tree, s) =>
      println(s)
      println(tree render s)
    }

    println("pos analysis")
    tokens.par.map(s => tagger.bestSequence(s) -> s).seq map { case (tags, s) =>
      println(s)
      println(tags.render)
    }
  }
}
