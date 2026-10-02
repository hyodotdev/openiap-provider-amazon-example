package dev.openiap.provider.fireos

import android.content.Context
import dev.hyo.openiap.OpenIapProtocol
import dev.hyo.openiap.OpenIapProviderFactory

class FireOsProviderFactory : OpenIapProviderFactory {
    override val storeId = STORE_ID
    override val coreVersion = BuildConfig.OPENIAP_CORE_VERSION
    override val clientProtocolVersion = BuildConfig.CLIENT_PROTOCOL_VERSION
    override val capabilities = setOf("pendingPurchases")
    override fun create(context: Context): OpenIapProtocol = FireOsProvider(context)

    companion object { const val STORE_ID = "amazon-example" }
}
