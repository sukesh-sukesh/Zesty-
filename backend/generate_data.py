
import pandas as pd
import random

categories = [
    "Delivery Issue",
    "Food Quality Issue",
    "Wrong / Missing Item",
    "Payment / Refund Issue",
    "App / Technical Issue"
]

templates = {
    "Delivery Issue": [
        "Delivery was extremely late.",
        "Rider was rude and shouted at me.",
        "Food arrived cold because the delivery took too long.",
        "Delivery person could not find my location.",
        "Waited for 2 hours and food never came.",
        "Delivery guy asked for a tip forcefully.",
        "My order was marked delivered but I didn't receive it.",
        "The delivery was delayed by 45 minutes.",
        "Driver was very polite but late due to traffic.", 
        "Package was damaged during delivery."
    ],
    "Food Quality Issue": [
        "Food was stale and smelled bad.",
        "Found a hair in my biryani.",
        "The pizza was burnt and undeniable.",
        "Too much salt in the curry.",
        "The quantity was very less for the price.",
        "Food was uncooked and raw.",
        "Ordered spicy but got sweet food.",
        "Quality of paneer was very poor.",
        "Rice was hard and undercooked.",
        "The taste was awful, threw it away."
    ],
    "Wrong / Missing Item": [
        "I ordered coke but got sprite.",
        "Missing garlic bread from the order.",
        "Received completely wrong order.",
        "Half the items were missing from the bag.",
        "I ordered veg biryani but got chicken.",
        "Dessert was missing.",
        "They forgot to send cutlery.",
        "Received a smaller portion size than ordered.",
        "Ordered 2 burgers, got only 1.",
        "Wrong toppings on the pizza."
    ],
    "Payment / Refund Issue": [
        "Money deducted but order failed.",
        "Refund not processed yet after 5 days.",
        "Charged twice for the same order.",
        "Coupon code didn't work but amount deducted.",
        "Wallet balance did not update after recharge.",
        "Unable to pay using UPI.",
        "Payment gateway crashed during transaction.",
        "Did not receive cashback as promised.",
        "Overcharged for delivery fees.",
        "Refund amount is incorrect."
    ],
    "App / Technical Issue": [
        "App crashes when I open the menu.",
        "Cannot track my order, map is blank.",
        "App is very slow and laggy.",
        "Unable to login to my account.",
        "Search function is not working.",
        "GPS location is showing wrong address.",
        "Cannot add items to cart.",
        "App freezes on the payment screen.",
        "Notification not received for order status.",
        "Images are not loading in the app."
    ]
}

data = []
for _ in range(500):
    category = random.choice(categories)
    text = random.choice(templates[category])
    # Add some random variations
    if random.random() > 0.5:
        text = text.lower()
    if random.random() > 0.8:
        text = text.replace(".", "!")
    
    data.append({"text": text, "category": category})

df = pd.DataFrame(data)
df.to_csv("backend/complaints_dataset.csv", index=False)
print("Generated 500 complaints in complaints_dataset.csv")
