package com.example.OnlineSellingApplicationBackend.DTO;

public class ClientProfileWithAddressDTO {
    private String name;
    private String tel;
    private AddressResponse address;


    public ClientProfileWithAddressDTO(String name, String tel, AddressResponse address) {
        this.name = name;
        this.tel = tel;
        this.address = address;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AddressResponse getAddress() {
        return address;
    }

    public void setAddress(AddressResponse address) {
        this.address = address;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }
}
