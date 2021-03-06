name := """tiwitalk"""

version := "1.0"

scalaVersion in Global := "2.11.7"

autoAPIMappings in Global := true

lazy val root = Project("root", file(".")).aggregate(empath, pigeon)

lazy val empath = Project("empath", file("empath")).settings(
  fork in run := true,
  libraryDependencies ++= Seq(
    "org.scalanlp" %% "epic-parser-en-span" % "2015.2.19",
    "org.scalanlp" %% "epic-pos-en" % "2015.2.19"
  )
)

lazy val pigeon = Project("pigeon", file("pigeon"))
  .settings(
    libraryDependencies ++= Seq(
      // Temporary- later, switch to a distributed cache
      "com.github.cb372" %% "scalacache-guava" % "0.6.4",
      "com.typesafe.akka" %% "akka-http-experimental" % "1.0",
      "org.scalatest" %% "scalatest" % "2.2.4" % "test",
      "com.lihaoyi" %% "upickle" % "0.3.1",
      "org.reactivemongo" %% "reactivemongo" % "0.11.2"
    ),
    packageName in Docker := "pigeon",
    maintainer in Docker := "Bryan Tan <bryan@tiwitalk.com",
    dockerBaseImage := "java:8-jre",
    dockerRepository := Some("tiwitalk"),
    dockerUpdateLatest := true,
    dockerEntrypoint in Docker := Seq("sh", "-c", "bin/pigeon"),
    dockerExposedPorts := Seq(9876)
  )
  .settings(Revolver.settings: _*)
  .enablePlugins(JavaAppPackaging, DockerPlugin)

scalacOptions in Global ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xfatal-warnings",
  "-Xlint"
)
