package dev.openiap.provider.fireos;

import android.content.Context;
import com.amazon.device.iap.PurchasingListener;
import com.amazon.device.iap.PurchasingService;
import com.amazon.device.iap.internal.model.*;
import com.amazon.device.iap.model.*;
import java.util.*;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;
import org.robolectric.annotation.Resetter;

/** Replace only the Amazon SDK transport; tests execute the production provider. */
@Implements(PurchasingService.class)
public class ShadowPurchasingService {
    private static PurchasingListener listener;
    private static final Map<String, Receipt> owned = new LinkedHashMap<>();
    static PurchaseResponse.RequestStatus nextStatus = PurchaseResponse.RequestStatus.SUCCESSFUL;
    static final List<String> fulfilled = new ArrayList<>();
    private static final UserData user = new UserDataBuilder().setUserId("test-user").setMarketplace("US").build();

    @Resetter public static void reset() {
        listener = null;
        owned.clear();
        fulfilled.clear();
        nextStatus = PurchaseResponse.RequestStatus.SUCCESSFUL;
    }
    @Implementation public static void registerListener(Context context, PurchasingListener value) { listener = value; }
    @Implementation public static void enablePendingPurchases() { }
    @Implementation public static RequestId getUserData() {
        RequestId id = RequestId.fromString(UUID.randomUUID().toString());
        listener.onUserDataResponse(new UserDataResponseBuilder().setRequestId(id).setRequestStatus(UserDataResponse.RequestStatus.SUCCESSFUL).setUserData(user).build());
        return id;
    }
    @Implementation public static RequestId getProductData(Set<String> skus) {
        RequestId id = RequestId.fromString(UUID.randomUUID().toString());
        Map<String, Product> products = new LinkedHashMap<>();
        for (String sku : skus) products.put(sku, new ProductBuilder().setSku(sku).setProductType(ProductType.CONSUMABLE).setDescription("Test product").setPrice("$0.99").setSmallIconUrl("https://example.com/icon.png").setTitle("Test product").build());
        listener.onProductDataResponse(new ProductDataResponseBuilder().setRequestId(id).setRequestStatus(ProductDataResponse.RequestStatus.SUCCESSFUL).setProductData(products).setUnavailableSkus(Collections.emptySet()).build());
        return id;
    }
    @Implementation public static RequestId purchase(String sku) {
        RequestId id = RequestId.fromString(UUID.randomUUID().toString());
        PurchaseResponse.RequestStatus status = nextStatus;
        nextStatus = PurchaseResponse.RequestStatus.SUCCESSFUL;
        Receipt receipt = null;
        if (status == PurchaseResponse.RequestStatus.SUCCESSFUL) {
            receipt = new ReceiptBuilder().setReceiptId(UUID.randomUUID().toString()).setSku(sku).setProductType(ProductType.CONSUMABLE).setPurchaseDate(new Date()).build();
            owned.put(receipt.getReceiptId(), receipt);
        }
        listener.onPurchaseResponse(new PurchaseResponseBuilder().setRequestId(id).setRequestStatus(status).setUserData(user).setReceipt(receipt).build());
        return id;
    }
    @Implementation public static RequestId getPurchaseUpdates(boolean reset) {
        RequestId id = RequestId.fromString(UUID.randomUUID().toString());
        listener.onPurchaseUpdatesResponse(new PurchaseUpdatesResponseBuilder().setRequestId(id).setRequestStatus(PurchaseUpdatesResponse.RequestStatus.SUCCESSFUL).setUserData(user).setReceipts(new ArrayList<>(owned.values())).setHasMore(false).build());
        return id;
    }
    @Implementation public static void notifyFulfillment(String receiptId, FulfillmentResult result) { fulfilled.add(receiptId); owned.remove(receiptId); }
}
