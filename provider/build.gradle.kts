import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import java.security.MessageDigest

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

val coreVersion = providers.gradleProperty("openIapCoreVersion").get()
val protocolVersion = providers.gradleProperty("clientProtocolVersion").get()
val conformanceVersion = providers.gradleProperty("conformanceVersion").get()
val inputRevision = providers.gradleProperty("openIapRevision")
val providerMetadata = JsonSlurper().parse(rootProject.file("package.json")) as Map<*, *>
val providerVersion = providerMetadata["version"] as String

android {
    namespace = "dev.openiap.provider.fireos"
    compileSdk = 36
    defaultConfig {
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
        buildConfigField("String", "OPENIAP_CORE_VERSION", "\"$coreVersion\"")
        buildConfigField("String", "CLIENT_PROTOCOL_VERSION", "\"$protocolVersion\"")
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    testOptions { unitTests.isIncludeAndroidResources = true }
    publishing { singleVariant("release") { withSourcesJar() } }
}
kotlin { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } }

dependencies {
    api("io.github.hyochan.openiap:openiap-core:$coreVersion")
    implementation("com.amazon.device:amazon-appstore-sdk:3.0.9")
    testImplementation("io.github.hyochan.openiap:openiap-conformance:$conformanceVersion")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.11.0")
    testImplementation("org.robolectric:robolectric:4.16.1")
    testImplementation("androidx.test:core:1.7.0")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                groupId = "dev.openiap.providers"
                artifactId = "openiap-provider-amazon-example"
                version = providerVersion
                pom {
                    name.set("OpenIAP Google Amazon community example")
                    description.set("Educational community provider example; use the official OpenIAP Amazon integration for apps")
                    licenses { license { name.set("MIT"); url.set("https://opensource.org/licenses/MIT") } }
                    properties.put("openiap.clientProtocolVersion", protocolVersion)
                    properties.put("openiap.conformanceVersion", conformanceVersion)
                    inputRevision.orNull?.let { properties.put("openiap.revision", it) }
                }
            }
        }
        repositories {
            maven {
                name = "experiment"
                url = uri(providers.gradleProperty("providerRepository").orNull ?: layout.buildDirectory.dir("maven").get().asFile)
            }
        }
    }
}

tasks.withType<Test>().configureEach {
    systemProperty("openiap.conformanceReport", layout.buildDirectory.file("reports/openiap/{storeId}.json").get().asFile.path)
    if (name == "testDebugUnitTest") {
        dependsOn("bundleReleaseAar")
        inputs.property("openIapRevision", inputRevision.orElse("unrecorded"))
        inputs.property("openIapCoreVersion", coreVersion)
        inputs.property("clientProtocolVersion", protocolVersion)
        inputs.property("conformanceVersion", conformanceVersion)
        val report = layout.buildDirectory.file("reports/openiap/amazon-example.json")
        val provenance = layout.buildDirectory.file("reports/openiap/build-input.json")
        val aar = layout.buildDirectory.file("outputs/aar/provider-release.aar")
        inputs.file(aar)
        outputs.file(report)
        outputs.file(provenance)
        doFirst {
            provenance.get().asFile.delete()
            report.get().asFile.delete()
        }
        doLast {
            if (!report.get().asFile.isFile) return@doLast
            fun digest(file: File) = MessageDigest.getInstance("SHA-256")
                .digest(file.readBytes()).joinToString("") { "%02x".format(it) }
            provenance.get().asFile.writeText(JsonOutput.toJson(mapOf(
                "revision" to inputRevision.getOrElse("unrecorded"),
                "coreVersion" to coreVersion,
                "clientProtocolVersion" to protocolVersion,
                "conformanceVersion" to conformanceVersion,
                "aarSha256" to digest(aar.get().asFile),
                "reportSha256" to digest(report.get().asFile),
            )))
        }
    }
}
