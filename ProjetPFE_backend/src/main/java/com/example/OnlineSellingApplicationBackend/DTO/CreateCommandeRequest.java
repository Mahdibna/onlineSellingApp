
package com.example.OnlineSellingApplicationBackend.DTO;

import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.List;

public class CreateCommandeRequest {
    private AddressRequest addressRequest;
    private List<PackSellingRequest> packs;
    private TypePaiment paymentType;
    private String paymentIntentId;  // This field is crucial
    public List<PackSellingRequest> getPacks() {
        return packs;
    }
    public void setPack(List<PackSellingRequest> packs) {
        this.packs = packs;
    }
    public void setPacks(List<PackSellingRequest> packs) {
        this.packs = packs;
    }

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }

    public AddressRequest getAddressRequest() { return addressRequest; }
    public void setAddressRequest(AddressRequest addressRequest) { this.addressRequest = addressRequest; }

    public String getPaymentIntentId() {
        return paymentIntentId;
    }

    public void setPaymentIntentId(String paymentIntentId) {
        this.paymentIntentId = paymentIntentId;
    }
}