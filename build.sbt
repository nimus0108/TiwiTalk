name := """tiwitalk"""

version := "1.0"

scalaVersion in Global := "2.11.7"

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
      "com.typesafe.akka" %% "akka-http-experimental" % "1.0-RC4",
      "org.scalatest" %% "scalatest" % "2.2.4" % "test",
      "com.lihaoyi" %% "upickle" % "0.2.8"
    )
  )
  .settings(Revolver.settings: _*)

scalacOptions in Global ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xfatal-warnings",
  "-Xlint"
)
