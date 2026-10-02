package dev.openiap.provider.fireos

import androidx.test.core.app.ApplicationProvider
import dev.hyo.openiap.*
import dev.hyo.openiap.conformance.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.resetMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], shadows = [ShadowPurchasingService::class], instrumentedPackages = ["com.amazon"])
@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class FireOsProviderConformanceTest : ProviderConformanceSuite() {
    init { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    override val timeoutMillis = 100L
    override val factory = FireOsProviderFactory()
    override val provider: OpenIapProtocol = factory.create(ApplicationProvider.getApplicationContext())
    override val adapter = object : StoreConformanceAdapter {
        override val store = IapStore.Unknown
        override val storeId = FireOsProviderFactory.STORE_ID
        override val capabilities = setOf(StoreCapability.PendingPurchases)
        override fun toActiveSubscription(purchase: PurchaseAndroid) = purchase.toActiveSubscription()
        override val normativeErrorCases = listOf(
            "ALREADY_PURCHASED" to ErrorCode.AlreadyOwned,
            "INVALID_SKU" to ErrorCode.SkuNotFound,
            "NOT_SUPPORTED" to ErrorCode.FeatureNotSupported,
            "INACTIVE_BASE_SUBSCRIPTION" to ErrorCode.ItemUnavailable,
            "PENDING" to ErrorCode.DeferredPayment,
            "FAILED" to ErrorCode.PurchaseError,
        ).map { (status, code) -> StoreErrorCase(status, code, checkNotNull(amazonPurchaseError(status, "sku"))) }
        override val unrecognizedError = checkNotNull(amazonPurchaseError(null, "sku"))
        override fun unsupportedOperationResult() = runBlocking { unsupportedRedeemOfferCode() }
    }
    override suspend fun triggerCapability(capability: StoreCapability) {
        check(capability == StoreCapability.PendingPurchases)
        ShadowPurchasingService.nextStatus = com.amazon.device.iap.model.PurchaseResponse.RequestStatus.PENDING
        provider.requestPurchase(RequestPurchaseProps.fromJson(mapOf(
            "type" to "in-app", "requestPurchase" to mapOf("google" to mapOf("skus" to listOf(testProductId))),
        )))
    }
    @After fun resetMainDispatcher() { Dispatchers.resetMain() }
    @Test fun `apple-only requests emit one developer error without launching a purchase`() = runBlocking {
        val errors = mutableListOf<OpenIapError>()
        var updates = 0
        provider.addPurchaseErrorListener { errors += it }
        provider.addPurchaseUpdateListener { updates += 1 }
        for (type in listOf("in-app", "subs")) {
            errors.clear()
            val result = provider.requestPurchase(RequestPurchaseProps.fromJson(mapOf(
                "type" to type,
                (if (type == "subs") "requestSubscription" else "requestPurchase") to
                    mapOf("apple" to mapOf("sku" to testProductId)),
            )))
            assertTrue((result as RequestPurchaseResultPurchases).value.isNullOrEmpty())
            assertEquals(type, 1, errors.size)
            assertTrue(errors.single() is OpenIapError.DeveloperError)
            assertEquals(0, updates)
        }
    }
    @Test fun `manifest discovers the independently packaged provider`() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        assertEquals("amazon-example", OpenIapProvider.factory(context).storeId)
        assertTrue(OpenIapProvider.create(context) is FireOsProvider)
    }
}
