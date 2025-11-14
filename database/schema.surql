-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- FUNCTIONS
-- ------------------------------

DEFINE FUNCTION fn::add_category($user: record<user>, $name: string, $icon: string) -> record<category> {
LET $category = (CREATE ONLY category SET name = $name, icon = $icon);
RELATE $user -> user_category -> ($category);
RETURN $category.id;
} COMMENT '' PERMISSIONS FULL;
DEFINE FUNCTION fn::add_transation($category: record<category>, $amount: float, $note: option<string>) -> record<transaction> {
LET $transaction = (CREATE ONLY transaction SET amount = $amount, note = $note);
RELATE ($category<-user_category) -> category_transaction -> ($transaction);
RETURN $transaction.id;
} COMMENT '' PERMISSIONS FULL;
DEFINE FUNCTION fn::transaction_ownership($category: record<category>, $transaction: record<transaction>) { RETURN array::any((SELECT id FROM $category->category_transaction WHERE out = $transaction)); } COMMENT '' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: category
-- ------------------------------

DEFINE TABLE category TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD created_at ON category TYPE datetime DEFAULT time::now() VALUE $value OR time::now() PERMISSIONS FULL;
DEFINE FIELD icon ON category TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON category TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON category TYPE datetime DEFAULT time::now() VALUE time::now() PERMISSIONS FULL;



-- ------------------------------
-- TABLE: category_transaction
-- ------------------------------

DEFINE TABLE category_transaction TYPE RELATION IN user_category OUT transaction SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON category_transaction TYPE record<user_category> PERMISSIONS FULL;
DEFINE FIELD out ON category_transaction TYPE record<transaction> PERMISSIONS FULL;

DEFINE INDEX category_transactions_index ON category_transaction FIELDS in, out UNIQUE;
DEFINE INDEX category_transactions_out ON category_transaction FIELDS out UNIQUE;

DEFINE EVENT category_transaction ON category_transaction WHEN ($event = 'DELETE') THEN { DELETE $value.out; };

-- ------------------------------
-- TABLE: transaction
-- ------------------------------

DEFINE TABLE transaction TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD amount ON transaction TYPE float PERMISSIONS FULL;
DEFINE FIELD created_at ON transaction TYPE datetime DEFAULT time::now() VALUE $value OR time::now() PERMISSIONS FULL;
DEFINE FIELD note ON transaction TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD updated_at ON transaction TYPE datetime DEFAULT time::now() VALUE time::now() PERMISSIONS FULL;



-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE user TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() VALUE $value OR time::now() PERMISSIONS FULL;
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value) PERMISSIONS FULL;
DEFINE FIELD password_hash ON user TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD username ON user TYPE string PERMISSIONS FULL;

DEFINE INDEX email_index ON user FIELDS email UNIQUE;
DEFINE INDEX username_index ON user FIELDS username UNIQUE;

DEFINE EVENT user_deleted ON user WHEN ($event = 'DELETE') THEN { DELETE $value.id->user_category; };

-- ------------------------------
-- TABLE: user_category
-- ------------------------------

DEFINE TABLE user_category TYPE RELATION IN user OUT category SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON user_category TYPE record<user> PERMISSIONS FULL;
DEFINE FIELD out ON user_category TYPE record<category> PERMISSIONS FULL;

DEFINE INDEX user_categories_index ON user_category FIELDS in, out UNIQUE;
DEFINE INDEX user_categories_out ON user_category FIELDS out UNIQUE;

DEFINE EVENT user_category_delete ON user_category WHEN ($event = 'DELETE') THEN { DELETE $value.out; };

