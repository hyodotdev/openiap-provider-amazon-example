pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        providers.gradleProperty("openIapRepository").orNull?.let { maven { url = uri(it) } }
        google()
        mavenCentral()
    }
}
rootProject.name = "openiap-provider-amazon-example"
include(":provider")
