package com.example.possystem.data.api

import com.example.possystem.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface PosApiService {

    @POST("auth.php")
    suspend fun login(
        @Body loginData: Map<String, String>
    ): Response<LoginResponse>

    @GET("products.php")
    suspend fun getProducts(): Response<List<Product>>

    @POST("products.php")
    suspend fun addProduct(
        @Body product: Product
    ): Response<ApiResponse<Product>>

    @PUT("products.php")
    suspend fun updateProduct(
        @Body product: Product
    ): Response<ApiResponse<Product>>

    @DELETE("products.php")
    suspend fun deleteProduct(
        @Query("id") id: String
    ): Response<ApiResponse<Unit>>

    @GET("customers.php")
    suspend fun getCustomers(): Response<ApiResponse<List<Customer>>>

    @POST("customers.php")
    suspend fun addCustomer(
        @Body customer: Customer
    ): Response<ApiResponse<Customer>>

    @GET("leads.php")
    suspend fun getLeads(): Response<List<Lead>>

    @POST("leads.php")
    suspend fun addLead(
        @Body lead: Lead
    ): Response<ApiResponse<Lead>>

    @POST("convert_lead.php")
    suspend fun convertLeadToCustomer(
        @Body params: Map<String, String>
    ): Response<ApiResponse<Customer>>

    @GET("purchases.php")
    suspend fun getPurchases(): Response<List<Purchase>>

    @POST("purchases.php")
    suspend fun createPurchase(
        @Body purchase: Purchase
    ): Response<ApiResponse<Purchase>>

    @GET("sales.php")
    suspend fun getSales(): Response<List<Sale>>

    @POST("sales.php")
    suspend fun createSale(
        @Body sale: Sale
    ): Response<ApiResponse<Sale>>

    @GET("projects.php")
    suspend fun getProjects(): Response<List<Project>>

    @POST("projects.php")
    suspend fun createProject(
        @Body project: Project
    ): Response<ApiResponse<Project>>

    @GET("tasks.php")
    suspend fun getTasks(
        @Query("project_id") projectId: String
    ): Response<List<Task>>

    @POST("tasks.php")
    suspend fun addTask(
        @Body task: Task
    ): Response<ApiResponse<Task>>

    @GET("reports.php")
    suspend fun getReportSummary(): Response<ReportSummary>

    @GET("users.php")
    suspend fun getUsers(): Response<List<User>>

    @GET("user_settings.php")
    suspend fun getSettings(): Response<UserSettings>
}
