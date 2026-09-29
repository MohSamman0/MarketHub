IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [AuditEvents] (
        [Id] bigint NOT NULL IDENTITY,
        [ActorId] uniqueidentifier NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [Detail] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditEvents] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [Vendors] (
        [Id] uniqueidentifier NOT NULL,
        [NameEn] nvarchar(max) NOT NULL,
        [NameAr] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Approved] bit NOT NULL,
        CONSTRAINT [PK_Vendors] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [Products] (
        [Id] uniqueidentifier NOT NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [NameEn] nvarchar(max) NOT NULL,
        [NameAr] nvarchar(max) NOT NULL,
        [DescriptionEn] nvarchar(max) NOT NULL,
        [DescriptionAr] nvarchar(max) NOT NULL,
        [Category] nvarchar(450) NOT NULL,
        [Image] nvarchar(max) NOT NULL,
        [Price] int NOT NULL,
        [Stock] int NOT NULL,
        [Active] bit NOT NULL,
        [Version] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Products_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [VendorId] uniqueidentifier NULL,
        [FailedLogins] int NOT NULL,
        [LockedUntil] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [Orders] (
        [Id] uniqueidentifier NOT NULL,
        [Number] nvarchar(32) NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [IdempotencyKey] nvarchar(80) NOT NULL,
        [RequestHash] nvarchar(max) NOT NULL,
        [Recipient] nvarchar(max) NOT NULL,
        [Phone] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Subtotal] int NOT NULL,
        [Shipping] int NOT NULL,
        [Tax] int NOT NULL,
        [Total] int NOT NULL,
        [PaymentStatus] nvarchar(max) NOT NULL,
        [PaymentProvider] nvarchar(max) NOT NULL,
        [PaymentSessionId] nvarchar(max) NULL,
        [PaymentUrl] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [Version] int NOT NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshSessions] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(64) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [Revoked] bit NOT NULL,
        CONSTRAINT [PK_RefreshSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE TABLE [OrderItems] (
        [Id] uniqueidentifier NOT NULL,
        [OrderId] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [NameEn] nvarchar(max) NOT NULL,
        [NameAr] nvarchar(max) NOT NULL,
        [Image] nvarchar(max) NOT NULL,
        [Quantity] int NOT NULL,
        [UnitPrice] int NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Version] int NOT NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_ProductId] ON [OrderItems] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_Number] ON [Orders] ([Number]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_UserId_IdempotencyKey] ON [Orders] ([UserId], [IdempotencyKey]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_Category_Active] ON [Products] ([Category], [Active]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_VendorId] ON [Products] ([VendorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshSessions_TokenHash] ON [RefreshSessions] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshSessions_UserId] ON [RefreshSessions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Users_VendorId] ON [Users] ([VendorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929055745_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260929055745_InitialCreate', N'10.0.9');
END;

COMMIT;
GO

