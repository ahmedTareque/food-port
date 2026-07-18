"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const VENDORS = [
    { name: "Burger Barn", slug: "burger-barn", cuisine: "American", color: "#E63946", booth: 1 },
    { name: "Pizza Palace", slug: "pizza-palace", cuisine: "Italian", color: "#457B9D", booth: 2 },
    { name: "Taco Fiesta", slug: "taco-fiesta", cuisine: "Mexican", color: "#F4A261", booth: 3 },
    { name: "Wok & Roll", slug: "wok-and-roll", cuisine: "Chinese", color: "#E9C46A", booth: 4 },
    { name: "Juice Junction", slug: "juice-junction", cuisine: "Drinks", color: "#2A9D8F", booth: 5 },
    { name: "Spice Garden", slug: "spice-garden", cuisine: "Indian", color: "#E76F51", booth: 6 },
    { name: "Sushi Stop", slug: "sushi-stop", cuisine: "Japanese", color: "#264653", booth: 7 },
    { name: "Falafel House", slug: "falafel-house", cuisine: "Middle Eastern", color: "#6A994E", booth: 8 },
    { name: "Dessert Den", slug: "dessert-den", cuisine: "Desserts", color: "#9B5DE5", booth: 9 },
    { name: "BBQ Boss", slug: "bbq-boss", cuisine: "BBQ", color: "#CB4335", booth: 10 },
    { name: "Food Port", slug: "food-port", cuisine: "Multi-Cuisine", color: "#FF6B35", booth: 11 },
    { name: "Milkshake & Cold Coffee Booth", slug: "milkshake-cold-coffee", cuisine: "Drinks", color: "#C9184A", booth: 12 },
    { name: "Waffle Booth", slug: "waffle-booth", cuisine: "Desserts", color: "#D4A373", booth: 13 },
    { name: "Chinese & Wings Booth", slug: "chinese-wings", cuisine: "Chinese", color: "#A4161A", booth: 14 },
    { name: "Roll Ice Cream Booth", slug: "roll-ice-cream", cuisine: "Desserts", color: "#06A77D", booth: 15 },
    { name: "Fuchka & Street Food Booth", slug: "fuchka-street-food", cuisine: "Street Food", color: "#BB3E03", booth: 16 },
    { name: "Cake & Dessert Booth", slug: "cake-dessert", cuisine: "Desserts", color: "#F72585", booth: 17 },
];
const MENU_TEMPLATES = {
    "burger-barn": {
        categories: [
            { name: "Burgers", items: [
                    { name: "Classic Smash Burger", desc: "Double smash patty, American cheese, pickles, special sauce", price: 12.99, tags: [], prepTime: 10 },
                    { name: "BBQ Bacon Burger", desc: "Beef patty, crispy bacon, BBQ sauce, onion rings", price: 14.99, tags: [], prepTime: 12 },
                    { name: "Mushroom Swiss", desc: "Beef patty, sautéed mushrooms, Swiss cheese, garlic aioli", price: 13.99, tags: [], prepTime: 11 },
                    { name: "Veggie Burger", desc: "Black bean patty, avocado, sprouts, chipotle mayo", price: 11.99, tags: ["vegan"], prepTime: 8 },
                ] },
            { name: "Sides", items: [
                    { name: "Loaded Fries", desc: "Crispy fries with cheese sauce, bacon bits, jalapeños", price: 5.99, tags: [], prepTime: 6 },
                    { name: "Onion Rings", desc: "Beer-battered thick-cut onion rings", price: 4.99, tags: [], prepTime: 7 },
                ] },
            { name: "Drinks", items: [
                    { name: "Fountain Drink", desc: "Coke, Sprite, or Lemonade", price: 2.99, tags: [], prepTime: 2 },
                    { name: "Milkshake", desc: "Vanilla, chocolate, or strawberry, 16oz", price: 5.99, tags: [], prepTime: 5 },
                ] },
        ],
    },
    "pizza-palace": {
        categories: [
            { name: "Pizzas", items: [
                    { name: "Margherita", desc: "San Marzano tomato, fresh mozzarella, basil", price: 14.99, tags: ["vegetarian"], prepTime: 15 },
                    { name: "Pepperoni Supreme", desc: "Triple pepperoni, mozzarella, oregano", price: 16.99, tags: [], prepTime: 15 },
                    { name: "BBQ Chicken", desc: "BBQ sauce, grilled chicken, red onion, cilantro", price: 17.99, tags: [], prepTime: 16 },
                    { name: "Veggie Medley", desc: "Bell peppers, mushrooms, olives, artichokes", price: 15.99, tags: ["vegan"], prepTime: 14 },
                ] },
            { name: "Pasta", items: [
                    { name: "Spaghetti Bolognese", desc: "Slow-cooked beef ragu, Parmesan, fresh pasta", price: 13.99, tags: [], prepTime: 12 },
                    { name: "Penne Arrabbiata", desc: "Spicy tomato, garlic, chilli, basil", price: 12.99, tags: ["vegan", "spicy"], prepTime: 10 },
                ] },
        ],
    },
    "taco-fiesta": {
        categories: [
            { name: "Tacos", items: [
                    { name: "Carne Asada Taco", desc: "Grilled beef, pico de gallo, guac, lime", price: 4.50, tags: [], prepTime: 7 },
                    { name: "Al Pastor Taco", desc: "Marinated pork, pineapple, cilantro", price: 4.50, tags: [], prepTime: 7 },
                    { name: "Fish Taco", desc: "Beer-battered cod, slaw, chipotle crema", price: 5.00, tags: [], prepTime: 8 },
                    { name: "Veggie Taco", desc: "Roasted peppers, black beans, cheese, salsa", price: 3.99, tags: ["vegetarian"], prepTime: 6 },
                ] },
            { name: "Bowls", items: [
                    { name: "Burrito Bowl", desc: "Rice, beans, choice of protein, all the toppings", price: 10.99, tags: [], prepTime: 8 },
                    { name: "Nachos Grande", desc: "Chips, cheese, jalapeños, guac, sour cream", price: 9.99, tags: ["vegetarian"], prepTime: 7 },
                ] },
        ],
    },
    "wok-and-roll": {
        categories: [
            { name: "Noodles", items: [
                    { name: "Pad Thai", desc: "Rice noodles, shrimp, egg, bean sprouts, peanuts", price: 13.99, tags: [], prepTime: 10 },
                    { name: "Lo Mein", desc: "Egg noodles, mixed vegetables, choice of protein", price: 12.99, tags: [], prepTime: 9 },
                    { name: "Spicy Dan Dan Noodles", desc: "Sesame paste, chilli oil, pork mince", price: 13.99, tags: ["spicy"], prepTime: 10 },
                ] },
            { name: "Rice Dishes", items: [
                    { name: "Fried Rice", desc: "Jasmine rice, egg, vegetables, soy sauce", price: 10.99, tags: [], prepTime: 8 },
                    { name: "General Tso Chicken", desc: "Crispy chicken, sweet-spicy sauce, steamed rice", price: 14.99, tags: ["spicy"], prepTime: 12 },
                ] },
            { name: "Dim Sum", items: [
                    { name: "Pork Dumplings (6pc)", desc: "Steamed pork and cabbage gyoza", price: 7.99, tags: [], prepTime: 8 },
                    { name: "Spring Rolls (3pc)", desc: "Crispy veggie spring rolls, sweet chilli dip", price: 5.99, tags: ["vegan"], prepTime: 6 },
                ] },
        ],
    },
    "juice-junction": {
        categories: [
            { name: "Smoothies", items: [
                    { name: "Mango Tango", desc: "Mango, pineapple, coconut milk, lime", price: 7.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Berry Blast", desc: "Mixed berries, banana, oat milk", price: 7.99, tags: ["vegan"], prepTime: 3 },
                    { name: "Green Machine", desc: "Spinach, kale, apple, ginger, cucumber", price: 8.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
                ] },
            { name: "Fresh Juices", items: [
                    { name: "Orange Squeeze", desc: "100% fresh squeezed oranges, 16oz", price: 5.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Watermelon Mint", desc: "Fresh watermelon, mint, hint of lime", price: 5.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
                ] },
            { name: "Coffee & Tea", items: [
                    { name: "Iced Latte", desc: "Double espresso, oat milk, vanilla, ice", price: 5.49, tags: [], prepTime: 3 },
                    { name: "Thai Iced Tea", desc: "Strong black tea, condensed milk, ice", price: 4.99, tags: [], prepTime: 3 },
                ] },
        ],
    },
    "spice-garden": {
        categories: [
            { name: "Curries", items: [
                    { name: "Butter Chicken", desc: "Tender chicken in creamy tomato sauce, basmati rice", price: 14.99, tags: ["gluten_free"], prepTime: 12 },
                    { name: "Lamb Rogan Josh", desc: "Slow-cooked lamb, aromatic spices, naan", price: 16.99, tags: [], prepTime: 15 },
                    { name: "Paneer Tikka Masala", desc: "Grilled paneer in spiced tomato gravy", price: 13.99, tags: ["vegetarian"], prepTime: 12 },
                    { name: "Dal Makhani", desc: "Black lentils, butter, cream, ginger", price: 11.99, tags: ["vegetarian", "gluten_free"], prepTime: 10 },
                ] },
            { name: "Breads", items: [
                    { name: "Garlic Naan", desc: "Tandoor-baked, garlic butter, coriander", price: 3.49, tags: [], prepTime: 5 },
                    { name: "Paratha", desc: "Whole wheat flaky flatbread", price: 2.99, tags: ["vegetarian"], prepTime: 5 },
                ] },
        ],
    },
    "sushi-stop": {
        categories: [
            { name: "Rolls", items: [
                    { name: "Dragon Roll", desc: "Shrimp tempura, cucumber, avocado, eel sauce", price: 14.99, tags: [], prepTime: 10 },
                    { name: "Spicy Tuna Roll", desc: "Fresh tuna, spicy mayo, cucumber, sesame", price: 13.99, tags: ["gluten_free", "spicy"], prepTime: 10 },
                    { name: "Rainbow Roll", desc: "California roll topped with assorted sashimi", price: 16.99, tags: [], prepTime: 12 },
                    { name: "Veggie Roll", desc: "Cucumber, avocado, carrot, cream cheese", price: 9.99, tags: ["vegetarian"], prepTime: 8 },
                ] },
            { name: "Nigiri", items: [
                    { name: "Salmon Nigiri (2pc)", desc: "Fresh Atlantic salmon over seasoned rice", price: 6.99, tags: ["gluten_free"], prepTime: 5 },
                    { name: "Tuna Nigiri (2pc)", desc: "Premium yellowfin tuna over seasoned rice", price: 7.99, tags: ["gluten_free"], prepTime: 5 },
                ] },
        ],
    },
    "falafel-house": {
        categories: [
            { name: "Wraps", items: [
                    { name: "Classic Falafel Wrap", desc: "Crispy falafel, hummus, tabbouleh, pickles, tahini", price: 10.99, tags: ["vegan"], prepTime: 7 },
                    { name: "Shawarma Wrap", desc: "Spiced chicken, garlic sauce, sumac onions", price: 12.99, tags: [], prepTime: 8 },
                    { name: "Grilled Halloumi Wrap", desc: "Halloumi, roasted veg, harissa, mint yoghurt", price: 11.99, tags: ["vegetarian"], prepTime: 8 },
                ] },
            { name: "Plates", items: [
                    { name: "Mezze Plate", desc: "Hummus, baba ganoush, tabbouleh, pita, falafel", price: 13.99, tags: ["vegan"], prepTime: 5 },
                    { name: "Grilled Kofta Plate", desc: "Spiced beef kofta skewers, rice, salad, tahini", price: 14.99, tags: [], prepTime: 12 },
                ] },
        ],
    },
    "dessert-den": {
        categories: [
            { name: "Cakes", items: [
                    { name: "Chocolate Lava Cake", desc: "Warm molten chocolate, vanilla ice cream", price: 7.99, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Cheesecake Slice", desc: "New York style, strawberry compote", price: 6.99, tags: ["vegetarian"], prepTime: 3 },
                ] },
            { name: "Ice Cream", items: [
                    { name: "Waffle Cone (2 scoops)", desc: "Choice of 12 flavors, freshly made waffle cone", price: 5.99, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Sundae", desc: "3 scoops, hot fudge, whipped cream, cherry", price: 7.99, tags: ["vegetarian"], prepTime: 4 },
                    { name: "Mango Sorbet", desc: "Dairy-free mango sorbet, 2 scoops", price: 4.99, tags: ["vegan", "gluten_free"], prepTime: 2 },
                ] },
            { name: "Waffles", items: [
                    { name: "Classic Belgian Waffle", desc: "Fresh waffle, maple syrup, whipped cream", price: 8.99, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella & Banana Waffle", desc: "Waffle, Nutella, sliced banana, powdered sugar", price: 9.99, tags: ["vegetarian"], prepTime: 9 },
                ] },
        ],
    },
    "bbq-boss": {
        categories: [
            { name: "Meats", items: [
                    { name: "Brisket Plate", desc: "12-hour smoked brisket, 2 sides", price: 18.99, tags: ["gluten_free"], prepTime: 5 },
                    { name: "Pulled Pork Sandwich", desc: "Slow-smoked pork, coleslaw, brioche bun, pickles", price: 13.99, tags: [], prepTime: 5 },
                    { name: "BBQ Ribs Half Rack", desc: "St. Louis style ribs, hickory smoked, house sauce", price: 19.99, tags: ["gluten_free"], prepTime: 7 },
                    { name: "Smoked Chicken", desc: "Half chicken, dry rub, 2 sides", price: 15.99, tags: ["gluten_free"], prepTime: 5 },
                ] },
            { name: "Sides", items: [
                    { name: "Mac & Cheese", desc: "Creamy four-cheese mac, breadcrumb crust", price: 4.99, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Smoked Baked Beans", desc: "Slow-cooked beans, brisket burnt ends", price: 3.99, tags: [], prepTime: 3 },
                    { name: "Coleslaw", desc: "Creamy house coleslaw, apple, celery seed", price: 2.99, tags: ["vegetarian", "gluten_free"], prepTime: 2 },
                ] },
        ],
    },
    "food-port": {
        categories: [
            { name: "Juice", items: [
                    { name: "Mango Juice", desc: "Fresh Rajshahi mango blend, chilled", price: 80, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Mixed Fruit Juice", desc: "Seasonal fruits blended fresh", price: 100, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Watermelon Juice", desc: "Pure watermelon, hint of lemon", price: 70, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Orange Juice", desc: "Freshly squeezed oranges", price: 90, tags: ["vegan", "gluten_free"], prepTime: 3 },
                    { name: "Sugarcane Juice", desc: "Cold pressed sugarcane with ginger", price: 60, tags: ["vegan", "gluten_free"], prepTime: 3 },
                ] },
            { name: "Cold Coffee", items: [
                    { name: "Iced Americano", desc: "Double espresso over ice", price: 120, tags: [], prepTime: 3 },
                    { name: "Cold Brew", desc: "12-hour cold-steeped coffee, served black or with milk", price: 150, tags: [], prepTime: 3 },
                    { name: "Dalgona Coffee", desc: "Whipped coffee over cold milk", price: 130, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Frappe", desc: "Blended coffee, ice, chocolate drizzle", price: 160, tags: ["vegetarian"], prepTime: 5 },
                ] },
            { name: "Milkshake", items: [
                    { name: "Chocolate Milkshake", desc: "Rich chocolate ice cream blended thick", price: 130, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Strawberry Milkshake", desc: "Fresh strawberry, vanilla ice cream", price: 130, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Mango Milkshake", desc: "Alphonso mango, full-cream milk", price: 140, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Oreo Milkshake", desc: "Oreo cookies blended with vanilla ice cream", price: 150, tags: ["vegetarian"], prepTime: 5 },
                ] },
            { name: "Waffle", items: [
                    { name: "Classic Belgian Waffle", desc: "Crispy waffle, maple syrup, whipped cream", price: 150, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella & Banana Waffle", desc: "Warm waffle, Nutella, sliced banana, powdered sugar", price: 200, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Lotus Biscoff Waffle", desc: "Waffle topped with Biscoff spread and cookie crumble", price: 220, tags: ["vegetarian"], prepTime: 9 },
                    { name: "Berry Waffle", desc: "Mixed berries compote, Greek yoghurt, honey drizzle", price: 210, tags: ["vegetarian"], prepTime: 8 },
                ] },
            { name: "Coffee", items: [
                    { name: "Cappuccino", desc: "Double shot espresso, steamed milk, thick foam", price: 120, tags: ["vegetarian"], prepTime: 4 },
                    { name: "Cafe Latte", desc: "Espresso with silky steamed milk", price: 130, tags: ["vegetarian"], prepTime: 4 },
                    { name: "Flat White", desc: "Ristretto shots, microfoam milk", price: 140, tags: ["vegetarian"], prepTime: 4 },
                    { name: "Mocha", desc: "Espresso, chocolate sauce, steamed milk, whipped cream", price: 150, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Americano", desc: "Double espresso with hot water", price: 100, tags: [], prepTime: 3 },
                ] },
            { name: "Loaded Box", items: [
                    { name: "Loaded Fries Box", desc: "Crispy fries, cheese sauce, jalapeños, sour cream", price: 250, tags: ["vegetarian"], prepTime: 10 },
                    { name: "Loaded Chicken Box", desc: "Fried chicken strips, fries, coleslaw, dipping sauce", price: 350, tags: [], prepTime: 12 },
                    { name: "Mac & Cheese Box", desc: "Creamy macaroni, breadcrumb crust, garlic bread", price: 280, tags: ["vegetarian"], prepTime: 10 },
                    { name: "BBQ Pulled Chicken Box", desc: "Slow-cooked chicken, BBQ sauce, rice, pickles", price: 380, tags: [], prepTime: 15 },
                ] },
            { name: "Crispy Sides", items: [
                    { name: "Crispy Fries", desc: "Golden shoestring fries with seasoning salt", price: 120, tags: ["vegan"], prepTime: 7 },
                    { name: "Onion Rings", desc: "Beer-battered thick onion rings, ranch dip", price: 130, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Popcorn Chicken", desc: "Bite-sized crispy chicken, spicy mayo", price: 160, tags: [], prepTime: 8 },
                    { name: "Mozzarella Sticks", desc: "Fried mozzarella, marinara dip (4pc)", price: 150, tags: ["vegetarian"], prepTime: 8 },
                ] },
            { name: "Fried Rice", items: [
                    { name: "Chicken Fried Rice", desc: "Wok-tossed jasmine rice, chicken, egg, soy sauce", price: 200, tags: [], prepTime: 12 },
                    { name: "Egg Fried Rice", desc: "Fragrant rice, scrambled egg, spring onion, oyster sauce", price: 150, tags: ["vegetarian"], prepTime: 10 },
                    { name: "Prawn Fried Rice", desc: "Tiger prawns, jasmine rice, garlic, chilli", price: 280, tags: [], prepTime: 12 },
                    { name: "Mixed Fried Rice", desc: "Chicken + prawn + egg, wok-charred rice", price: 320, tags: [], prepTime: 13 },
                ] },
            { name: "Wings & Lollipops", items: [
                    { name: "Buffalo Wings (6pc)", desc: "Classic buffalo sauce, celery, blue cheese dip", price: 280, tags: ["spicy"], prepTime: 12 },
                    { name: "Honey Garlic Wings (6pc)", desc: "Sweet-savory honey garlic glaze", price: 300, tags: [], prepTime: 12 },
                    { name: "Chicken Lollipop (4pc)", desc: "French-cut drumettes, dry rub spice, mint chutney", price: 250, tags: [], prepTime: 12 },
                    { name: "BBQ Lollipop (4pc)", desc: "Smoky BBQ glazed chicken lollipops", price: 270, tags: [], prepTime: 12 },
                ] },
            { name: "Taco", items: [
                    { name: "Chicken Taco", desc: "Spiced grilled chicken, pico de gallo, sour cream, flour tortilla", price: 180, tags: [], prepTime: 8 },
                    { name: "Beef Taco", desc: "Seasoned ground beef, cheddar, lettuce, salsa", price: 200, tags: [], prepTime: 8 },
                    { name: "Prawn Taco", desc: "Garlic butter prawns, mango salsa, lime crema", price: 220, tags: [], prepTime: 10 },
                    { name: "Veggie Taco", desc: "Roasted peppers, black beans, guac, feta", price: 150, tags: ["vegetarian"], prepTime: 7 },
                ] },
            { name: "Chow Mein", items: [
                    { name: "Chicken Chow Mein", desc: "Stir-fried egg noodles, chicken, mixed vegetables", price: 200, tags: [], prepTime: 10 },
                    { name: "Beef Chow Mein", desc: "Egg noodles, tender beef strips, bok choy, oyster sauce", price: 230, tags: [], prepTime: 12 },
                    { name: "Veg Chow Mein", desc: "Mixed vegetables, tofu, sesame oil, soy sauce", price: 150, tags: ["vegetarian"], prepTime: 9 },
                    { name: "Prawn Chow Mein", desc: "Tiger prawns, egg noodles, ginger-garlic sauce", price: 280, tags: [], prepTime: 12 },
                ] },
            { name: "Momo", items: [
                    { name: "Steamed Chicken Momo (6pc)", desc: "Minced chicken, ginger, coriander in thin dough, tomato chutney", price: 150, tags: [], prepTime: 15 },
                    { name: "Fried Chicken Momo (6pc)", desc: "Pan-fried chicken dumplings, crispy bottom", price: 170, tags: [], prepTime: 15 },
                    { name: "Steamed Veg Momo (6pc)", desc: "Mixed vegetable filling, sesame dipping sauce", price: 120, tags: ["vegetarian"], prepTime: 12 },
                    { name: "Jhol Momo (6pc)", desc: "Steamed momo in spicy sesame broth", price: 180, tags: [], prepTime: 18 },
                ] },
            { name: "Nachos", items: [
                    { name: "Classic Nachos", desc: "Tortilla chips, nacho cheese, jalapeños, salsa, sour cream", price: 200, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Loaded Nachos", desc: "Chips, pulled chicken, cheese, guac, all toppings", price: 280, tags: [], prepTime: 10 },
                    { name: "BBQ Chicken Nachos", desc: "Smoky BBQ chicken, cheddar melt, pickled red onion", price: 300, tags: [], prepTime: 10 },
                ] },
            { name: "Roll Ice Cream", items: [
                    { name: "Mango Roll Ice Cream", desc: "Fresh mango rolled ice cream, mango pieces, condensed milk", price: 180, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Oreo Roll Ice Cream", desc: "Vanilla base, Oreo crumble, chocolate drizzle", price: 200, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Strawberry Cheesecake Roll", desc: "Strawberry ice cream rolls, cheesecake bits", price: 210, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella Roll Ice Cream", desc: "Chocolate-hazelnut base, hazelnut crunch", price: 220, tags: ["vegetarian"], prepTime: 8 },
                ] },
            { name: "Fuchka & All", items: [
                    { name: "Fuchka (8pc)", desc: "Crispy puris filled with spiced potato, tamarind water", price: 60, tags: ["vegan"], prepTime: 5 },
                    { name: "Chotpoti", desc: "Chickpeas, boiled egg, potato, tamarind sauce, green chilli", price: 80, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Jhalmuri", desc: "Puffed rice, mustard oil, fresh veggies, spice mix", price: 50, tags: ["vegan"], prepTime: 3 },
                    { name: "Dahi Fuchka (8pc)", desc: "Fuchka with sweetened yoghurt, tamarind, boondi", price: 80, tags: ["vegetarian"], prepTime: 5 },
                ] },
            { name: "Pudding & Dessert", items: [
                    { name: "Chocolate Pudding", desc: "Silky dark chocolate custard, gold leaf garnish", price: 120, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Caramel Pudding", desc: "Classic crème caramel, burnt sugar top", price: 100, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Bread Pudding", desc: "Brioche pudding, vanilla custard, raisins", price: 110, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Tiramisu", desc: "Espresso-soaked ladyfingers, mascarpone cream", price: 180, tags: ["vegetarian"], prepTime: 3 },
                ] },
            { name: "Cake & Pastry", items: [
                    { name: "Chocolate Cake Slice", desc: "3-layer dark chocolate cake, ganache frosting", price: 150, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Red Velvet Slice", desc: "Moist red velvet, cream cheese frosting", price: 180, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Cheesecake Slice", desc: "New York baked cheesecake, berry compote", price: 200, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Croissant", desc: "Butter croissant, plain or almond filled", price: 120, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Brownie", desc: "Fudgy walnut brownie, served warm with ice cream", price: 130, tags: ["vegetarian"], prepTime: 3 },
                ] },
            { name: "Tea", items: [
                    { name: "Milk Tea", desc: "Strong Sylhet CTC brew, full-cream milk, sugar", price: 60, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Masala Chai", desc: "Spiced tea — ginger, cardamom, cinnamon, clove", price: 70, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Lemon Tea", desc: "Darjeeling tea, lemon wedge, honey", price: 50, tags: ["vegan"], prepTime: 4 },
                    { name: "Green Tea", desc: "Jasmine green tea, served hot or iced", price: 60, tags: ["vegan"], prepTime: 4 },
                ] },
            { name: "Drinks", items: [
                    { name: "Coke", desc: "Chilled Coca-Cola, 330ml can", price: 60, tags: ["vegan"], prepTime: 1 },
                    { name: "Sprite", desc: "Chilled Sprite, 330ml can", price: 60, tags: ["vegan"], prepTime: 1 },
                    { name: "Mineral Water", desc: "Still mineral water, 500ml", price: 30, tags: ["vegan", "gluten_free"], prepTime: 1 },
                    { name: "Sparkling Water", desc: "Perrier sparkling mineral water, 330ml", price: 80, tags: ["vegan", "gluten_free"], prepTime: 1 },
                    { name: "Lassi", desc: "Sweet or salted yoghurt drink, chilled", price: 90, tags: ["vegetarian"], prepTime: 3 },
                ] },
            { name: "Ice Cream", items: [
                    { name: "Vanilla Cone", desc: "Single scoop vanilla in a crispy waffle cone", price: 80, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Chocolate Bar", desc: "Milk chocolate ice cream bar, dark chocolate coating", price: 60, tags: ["vegetarian"], prepTime: 1 },
                    { name: "Strawberry Scoop", desc: "Double scoop strawberry in a cup", price: 100, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Sundae", desc: "3 scoops, hot fudge, sprinkles, whipped cream, cherry", price: 180, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Kulfi (2pc)", desc: "Traditional pistachio kulfi on a stick", price: 100, tags: ["vegetarian"], prepTime: 1 },
                ] },
        ],
    },
    "milkshake-cold-coffee": {
        categories: [
            { name: "Milkshake", items: [
                    { name: "Chocolate Milkshake", desc: "Rich chocolate ice cream blended thick", price: 160, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Banana Milkshake", desc: "Fresh banana blended with vanilla ice cream", price: 100, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Strawberry Milkshake", desc: "Fresh strawberry, vanilla ice cream", price: 150, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Milkshake (Oreo, etc.)", desc: "Oreo cookies blended with vanilla ice cream", price: 160, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Caramel Milkshake", desc: "Caramel syrup blended with vanilla ice cream", price: 200, tags: ["vegetarian"], prepTime: 5 },
                ] },
            { name: "Cold Coffee", items: [
                    { name: "Chocolate Cold Coffee", desc: "Cold coffee blended with chocolate syrup", price: 160, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Extra Choco Cold Coffee", desc: "Double chocolate cold coffee, extra rich", price: 200, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Cold Coffee", desc: "Classic chilled blended coffee", price: 150, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Strawberry Cold Coffee", desc: "Cold coffee blended with strawberry syrup", price: 160, tags: ["vegetarian"], prepTime: 5 },
                ] },
        ],
    },
    "waffle-booth": {
        categories: [
            { name: "Waffles", items: [
                    { name: "Nutella Regular", desc: "Warm waffle topped with Nutella", price: 150, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella Extreme", desc: "Loaded Nutella waffle with extra drizzle", price: 170, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutty Nutella", desc: "Nutella waffle topped with mixed nuts", price: 170, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella & Strawberry", desc: "Nutella waffle with fresh strawberry slices", price: 180, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Ice-Cream Nutella", desc: "Nutella waffle topped with a scoop of ice cream", price: 200, tags: ["vegetarian"], prepTime: 9 },
                    { name: "Nutshell Banana", desc: "Waffle with banana and hazelnut spread", price: 180, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Whippy Nutella", desc: "Nutella waffle topped with whipped cream", price: 180, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Red Velvet", desc: "Red velvet flavored waffle with cream cheese drizzle", price: 160, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Doreo Secret", desc: "Waffle loaded with Oreo crumble and sauce", price: 190, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Mango Madness", desc: "Waffle topped with fresh mango and cream", price: 220, tags: ["vegetarian"], prepTime: 9 },
                    { name: "Nutty Caramel", desc: "Waffle with caramel drizzle and mixed nuts", price: 220, tags: ["vegetarian"], prepTime: 9 },
                ] },
        ],
    },
    "chinese-wings": {
        categories: [
            { name: "Rice", items: [
                    { name: "Fried Rice", desc: "Wok-tossed jasmine rice, egg, spring onion", price: 150, tags: ["vegetarian"], prepTime: 10 },
                    { name: "Fried Rice & Mixed Vegetable", desc: "Fried rice served with stir-fried mixed vegetables", price: 260, tags: ["vegetarian"], prepTime: 12 },
                ] },
            { name: "Wings & Lollipop", items: [
                    { name: "Chicken Wings (6 pcs)", desc: "Crispy fried chicken wings, house spice mix", price: 150, tags: [], prepTime: 12 },
                    { name: "Chicken Lollipop (5 pcs)", desc: "French-cut drumettes, dry rub spice, dip", price: 120, tags: [], prepTime: 12 },
                ] },
        ],
    },
    "roll-ice-cream": {
        categories: [
            { name: "Roll Ice Cream", items: [
                    { name: "Doreo Secret", desc: "Vanilla base rolled ice cream, Oreo crumble", price: 120, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Strawberry Sense", desc: "Strawberry rolled ice cream with fresh fruit", price: 140, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Strawberry Blust", desc: "Loaded strawberry rolled ice cream, extra toppings", price: 200, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Mango Madness", desc: "Fresh mango rolled ice cream, mango pieces", price: 180, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Dragon Brew", desc: "Dragon fruit rolled ice cream, colorful toppings", price: 190, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Nutella Nuts", desc: "Chocolate-hazelnut base, mixed nuts crunch", price: 220, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Dates & Nuts", desc: "Date-caramel rolled ice cream, mixed nuts", price: 240, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Banana Cream", desc: "Banana rolled ice cream, cream drizzle", price: 160, tags: ["vegetarian"], prepTime: 8 },
                    { name: "Mixed Fruit", desc: "Rolled ice cream loaded with seasonal fruits", price: 250, tags: ["vegetarian"], prepTime: 9 },
                ] },
        ],
    },
    "fuchka-street-food": {
        categories: [
            { name: "Fuchka & Chatpati", items: [
                    { name: "Doi Fuchka", desc: "Fuchka topped with sweetened yoghurt, tamarind", price: 120, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Full Egg Fuchka", desc: "Fuchka loaded with boiled egg and tamarind water", price: 80, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Full Egg Chatpati", desc: "Chatpati loaded with boiled egg", price: 80, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Classic Fuchka", desc: "Crispy puris filled with spiced potato, tamarind water", price: 60, tags: ["vegan"], prepTime: 5 },
                    { name: "Velpuri", desc: "Puffed rice street snack, spiced and tangy", price: 50, tags: ["vegan"], prepTime: 3 },
                    { name: "Classic Chatpati", desc: "Chickpeas, potato, tamarind sauce, green chilli", price: 60, tags: ["vegetarian"], prepTime: 5 },
                    { name: "Panipuri", desc: "Crispy puris with tangy spiced water", price: 50, tags: ["vegan"], prepTime: 5 },
                ] },
        ],
    },
    "cake-dessert": {
        categories: [
            { name: "Cakes", items: [
                    { name: "Cheese Vanilla Cake", desc: "Soft vanilla sponge with cream cheese frosting", price: 120, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Juicy Lemon Cake", desc: "Moist lemon sponge, citrus glaze", price: 110, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Red Velvet Cake", desc: "Classic red velvet, cream cheese frosting", price: 120, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Chocolate Mousse", desc: "Silky dark chocolate mousse", price: 130, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Butterscotch Cake", desc: "Butterscotch sponge, caramelized nuts", price: 120, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Regular Chocolate Pastry", desc: "Classic chocolate sponge pastry", price: 60, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Chocolate Coated Brownie", desc: "Fudgy brownie coated in chocolate", price: 100, tags: ["vegetarian"], prepTime: 3 },
                ] },
            { name: "Traditional Desserts", items: [
                    { name: "Aflatoon", desc: "Traditional Bengali sweet, khoya and sugar syrup", price: 100, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Special Tasty Balushai", desc: "Flaky, syrup-soaked traditional sweet", price: 40, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Sweet Yogurt (Curd)", desc: "Traditional sweetened set yoghurt", price: 40, tags: ["vegetarian"], prepTime: 1 },
                    { name: "Rice Pudding (Phirni)", desc: "Creamy rice pudding, cardamom and nuts", price: 40, tags: ["vegetarian"], prepTime: 2 },
                    { name: "Tapioca Pearls (Sagodana)", desc: "Sweetened tapioca pearl pudding", price: 60, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Egg Milk Caramel", desc: "Classic baked egg custard, caramel top", price: 65, tags: ["vegetarian"], prepTime: 3 },
                    { name: "Green Coconut Refreshing", desc: "Chilled green coconut water, served fresh", price: 40, tags: ["vegan", "gluten_free"], prepTime: 1 },
                ] },
        ],
    },
};
async function main() {
    console.log('🌱 Seeding Food Port database...');
    await prisma.foodVillage.upsert({
        where: { id: 'fv-main' },
        update: {},
        create: { id: 'fv-main', name: 'The Food Port', tagline: 'Good Food. Great Vibes.', tax_rate: 0.0825 },
    });
    for (let i = 1; i <= 20; i++) {
        await prisma.table.upsert({
            where: { table_number: i },
            update: {},
            create: { table_number: i, label: `Table ${i}` },
        });
    }
    console.log('✅ Tables created (1-20)');
    for (const vd of VENDORS) {
        const vendor = await prisma.vendor.upsert({
            where: { slug: vd.slug },
            update: {},
            create: {
                name: vd.name,
                slug: vd.slug,
                cuisine_type: vd.cuisine,
                booth_number: vd.booth,
                booth_color: vd.color,
                avg_prep_time_minutes: 10,
                status: 'online',
                is_accepting_orders: true,
                notification_prefs: { new_order_sound: true, volume: 80 },
            },
        });
        const menuTemplate = MENU_TEMPLATES[vd.slug];
        if (!menuTemplate)
            continue;
        for (let ci = 0; ci < menuTemplate.categories.length; ci++) {
            const cat = menuTemplate.categories[ci];
            const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const category = await prisma.menuCategory.upsert({
                where: { vendor_id_slug: { vendor_id: vendor.id, slug } },
                update: {},
                create: { vendor_id: vendor.id, name: cat.name, slug, sort_order: ci },
            });
            for (let ii = 0; ii < cat.items.length; ii++) {
                const item = cat.items[ii];
                const existing = await prisma.menuItem.findFirst({ where: { vendor_id: vendor.id, name: item.name } });
                if (!existing) {
                    await prisma.menuItem.create({
                        data: {
                            vendor_id: vendor.id,
                            category_id: category.id,
                            name: item.name,
                            description: item.desc,
                            price: item.price,
                            prep_time_minutes: item.prepTime,
                            dietary_tags: item.tags,
                            allergens: [],
                            sort_order: ii,
                        },
                    });
                }
            }
        }
        if (vd.slug === 'burger-barn') {
            const existing = await prisma.modifierGroup.findFirst({ where: { vendor_id: vendor.id, name: 'Extras' } });
            if (!existing) {
                await prisma.modifierGroup.create({
                    data: {
                        vendor_id: vendor.id,
                        name: 'Extras',
                        is_required: false,
                        min_selections: 0,
                        max_selections: 5,
                        modifiers: { create: [
                                { name: 'Extra Cheese', price_adjustment: 1.50, sort_order: 0 },
                                { name: 'Extra Patty', price_adjustment: 3.00, sort_order: 1 },
                                { name: 'Bacon', price_adjustment: 2.00, sort_order: 2 },
                                { name: 'Avocado', price_adjustment: 1.75, sort_order: 3 },
                                { name: 'No Onions', price_adjustment: 0, sort_order: 4 },
                            ] },
                    },
                });
            }
        }
        if (vd.slug === 'juice-junction') {
            const existing = await prisma.modifierGroup.findFirst({ where: { vendor_id: vendor.id, name: 'Size' } });
            if (!existing) {
                await prisma.modifierGroup.create({
                    data: {
                        vendor_id: vendor.id,
                        name: 'Size',
                        is_required: true,
                        min_selections: 1,
                        max_selections: 1,
                        modifiers: { create: [
                                { name: 'Regular (12oz)', price_adjustment: 0, sort_order: 0 },
                                { name: 'Large (16oz)', price_adjustment: 1.50, sort_order: 1 },
                                { name: 'XL (20oz)', price_adjustment: 2.50, sort_order: 2 },
                            ] },
                    },
                });
            }
        }
        console.log(`✅ ${vd.name} seeded`);
    }
    const foodPortVendor = await prisma.vendor.findUnique({ where: { slug: 'food-port' } });
    if (foodPortVendor) {
        const existingSpice = await prisma.modifierGroup.findFirst({ where: { vendor_id: foodPortVendor.id, name: 'Spice Level' } });
        if (!existingSpice) {
            await prisma.modifierGroup.create({
                data: {
                    vendor_id: foodPortVendor.id,
                    name: 'Spice Level',
                    is_required: false,
                    min_selections: 0,
                    max_selections: 1,
                    modifiers: {
                        create: [
                            { name: 'Mild', price_adjustment: 0, sort_order: 0 },
                            { name: 'Medium', price_adjustment: 0, sort_order: 1 },
                            { name: 'Hot 🌶', price_adjustment: 0, sort_order: 2 },
                            { name: 'Extra Hot 🔥', price_adjustment: 10, sort_order: 3 },
                        ],
                    },
                },
            });
        }
        const existingSize = await prisma.modifierGroup.findFirst({ where: { vendor_id: foodPortVendor.id, name: 'Size Upgrade' } });
        if (!existingSize) {
            await prisma.modifierGroup.create({
                data: {
                    vendor_id: foodPortVendor.id,
                    name: 'Size Upgrade',
                    is_required: false,
                    min_selections: 0,
                    max_selections: 1,
                    modifiers: {
                        create: [
                            { name: 'Regular', price_adjustment: 0, sort_order: 0 },
                            { name: 'Large (+50 BDT)', price_adjustment: 50, sort_order: 1 },
                            { name: 'XL (+100 BDT)', price_adjustment: 100, sort_order: 2 },
                        ],
                    },
                },
            });
        }
        const fpPinHash = await bcrypt.hash('pin:5678', 10);
        const existingFpPin = await prisma.staffPin.findFirst({ where: { vendor_id: foodPortVendor.id, label: 'Food Port Kitchen' } });
        if (!existingFpPin) {
            await prisma.staffPin.create({
                data: { vendor_id: foodPortVendor.id, pin_hash: fpPinHash, label: 'Food Port Kitchen', role: 'vendor_kitchen' },
            });
            console.log('✅ Staff PIN created for Food Port (PIN: 5678)');
        }
        console.log('✅ Food Port modifiers + staff PIN seeded');
    }
    const pinHash = await bcrypt.hash('pin:1234', 10);
    const burgerVendor = await prisma.vendor.findUnique({ where: { slug: 'burger-barn' } });
    if (burgerVendor) {
        const existingPin = await prisma.staffPin.findFirst({ where: { vendor_id: burgerVendor.id, label: 'Kitchen Station 1' } });
        if (!existingPin) {
            await prisma.staffPin.create({
                data: { vendor_id: burgerVendor.id, pin_hash: pinHash, label: 'Kitchen Station 1', role: 'vendor_kitchen' },
            });
            console.log('✅ Staff PIN created for Burger Barn (PIN: 1234)');
        }
    }
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const vendorPassHash = await bcrypt.hash('vendor123', 10);
    await prisma.user.upsert({
        where: { supabase_id: '00000000-0000-0000-0000-000000000001' },
        update: { password_hash: adminPassHash },
        create: {
            supabase_id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@foodvillage.com',
            full_name: 'Super Admin',
            role: 'super_admin',
            password_hash: adminPassHash,
        },
    });
    console.log('✅ Super admin user seeded (admin@foodvillage.com / admin123)');
    for (let i = 0; i < VENDORS.length; i++) {
        const vd = VENDORS[i];
        const vendor = await prisma.vendor.findUnique({ where: { slug: vd.slug } });
        if (!vendor)
            continue;
        const supabaseId = `00000000-0000-0000-0001-${String(i + 1).padStart(12, '0')}`;
        const email = `booth${vd.booth}@foodvillage.com`;
        await prisma.user.upsert({
            where: { supabase_id: supabaseId },
            update: { password_hash: vendorPassHash, vendor_id: vendor.id },
            create: {
                supabase_id: supabaseId,
                email,
                full_name: `${vd.name} Manager`,
                role: 'vendor_owner',
                vendor_id: vendor.id,
                password_hash: vendorPassHash,
            },
        });
    }
    console.log('✅ Vendor manager accounts seeded (booth1–17@foodvillage.com / vendor123)');
    console.log('\n🎉 Seed complete!');
    console.log('  • 17 vendors with menus (incl. Food Port and 6 booth vendors with BDT pricing)');
    console.log('  • 20 tables');
    console.log('  • 1 food port config');
    console.log('  • Super admin: admin@foodvillage.com / admin123');
    console.log('  • Vendor managers: booth1–17@foodvillage.com / vendor123');
    console.log('  • Kitchen PIN (Burger Barn): 1234');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map