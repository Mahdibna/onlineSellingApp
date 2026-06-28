package com.example.OnlineSellingApplicationBackend.DTO;
import com.example.OnlineSellingApplicationBackend.entities.TypePaiment;

import java.util.Date;
import java.util.List;

public class CommandeDetailDTO {
    private Long orderId;
    private String orderType;
    private Date orderDate;
    private String status;
    private ClientInfoDTO client;
    private AddressDTO deliveryAddress;
    private List<OrderItemDTO> items;
    private Double total;
    private TypePaiment paymentType;

    public TypePaiment getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(TypePaiment paymentType) {
        this.paymentType = paymentType;
    }

    // Getters et Setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ClientInfoDTO getClient() {
        return client;
    }

    public void setClient(ClientInfoDTO client) {
        this.client = client;
    }

    public AddressDTO getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(AddressDTO deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    // Classes internes
    public static class ClientInfoDTO {
        private String name;
        private String email;
        private String tel;

        public String getTel() {
            return tel;
        }

        public void setTel(String tel) {
            this.tel = tel;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class AddressDTO {
        private String street;
        private String number;
        private String city;
        private String country;

        public String getStreet() {
            return street;
        }

        public void setStreet(String street) {
            this.street = street;
        }

        public String getNumber() {
            return number;
        }

        public void setNumber(String number) {
            this.number = number;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }
    }

    public static class OrderItemDTO {
        private String itemType;
        private String name;
        private Integer quantity;

        private List<String> packContents;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }



        public List<String> getPackContents() {
            return packContents;
        }

        public void setPackContents(List<String> packContents) {
            this.packContents = packContents;
        }

        public String getItemType() {
            return itemType;
        }

        public void setItemType(String itemType) {
            this.itemType = itemType;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }


    }
}
