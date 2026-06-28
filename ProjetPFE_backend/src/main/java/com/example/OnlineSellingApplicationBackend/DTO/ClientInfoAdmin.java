package com.example.OnlineSellingApplicationBackend.DTO;

public class ClientInfoAdmin {
    private ClientInfoResponse clientInfoResponse;
    private AddressResponse addressResponse;

    public ClientInfoAdmin(ClientInfoResponse clientInfoResponse, AddressResponse addressResponse) {
        this.clientInfoResponse = clientInfoResponse;
        this.addressResponse = addressResponse;
    }

    public ClientInfoResponse getClientInfoResponse() {
        return clientInfoResponse;
    }

    public void setClientInfoResponse(ClientInfoResponse clientInfoResponse) {
        this.clientInfoResponse = clientInfoResponse;
    }

    public AddressResponse getAddressResponse() {
        return addressResponse;
    }

    public void setAddressResponse(AddressResponse addressResponse) {
        this.addressResponse = addressResponse;
    }
}
