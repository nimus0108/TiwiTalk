name := """launch"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.6"

libraryDependencies ++= Seq(
  cache,
  ws,
  "com.typesafe.play" %% "play-slick" % "1.0.0",
  "com.typesafe.play" %% "play-slick-evolutions" % "1.0.0",
  "org.postgresql" % "postgresql" % "9.4-1201-jdbc41",
  "com.typesafe.play" %% "play-mailer" % "3.0.1"
)

pipelineStages := Seq(uglify, digest, gzip)

packageName in Docker := "launch"

maintainer in Docker := "Bryan Tan <admin@tiwitalk.com>"

dockerBaseImage := "java:8-jre"

dockerRepository := Some("tiwitalk")

dockerUpdateLatest := true

dockerEntrypoint in Docker := Seq("sh", "-c", "bin/launch")

dockerExposedPorts := Seq(9000)

// Play provides two styles of routers, one expects its actions to be injected, the
// other, legacy style, accesses its actions statically.
routesGenerator := InjectedRoutesGenerator
