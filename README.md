# pet-grooming-services

```mermaid
erDiagram

    users {
        int id PK
        string full_name
        string email
        string phone
        string description
        timestamp created_at
    }

    species {
        int id PK
        string name
    }

    pets {
        int id PK
        string name
        int species FK
        int owner FK
        uuid uuid
        timestamp created_at
    }

    services {
        int id PK
        string name
        float base_price
        uuid uuid
        timestamp created_at
    }

    appointments {
        int id PK
        int user_id FK
        int pet_id FK
        int service_id FK
        string description
        timestamp created_at
    }

    weight_classes {
        int id PK
        string label
    }

    service_configurations {
        int species_id FK
        int service_id FK
        int weight_class_id FK
        decimal price
        int duration_minutes
        boolean is_active
    }

    users ||--o{ pets : owns
    users ||--o{ appointments : books
    pets ||--o{ appointments : has
    services ||--o{ appointments : includes
    species ||--o{ pets : categorizes

    species ||--o{ service_configurations : config
    services ||--o{ service_configurations : config
    weight_classes ||--o{ service_configurations : config
